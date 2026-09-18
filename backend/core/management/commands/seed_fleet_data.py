import csv
import random
import subprocess
import sys
from datetime import date
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Crew, Plant, PlantDay, PlantDayEvent, User

# Dev-only pre-determined accounts (see DECISIONS.md: no signup flow).
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'solar123'
USER_PASSWORD = 'solar123'
USER_POPULATION_RATIO = 0.6

# seed_data.py's REGIONS / crew home bases are fixed, so a hardcoded continent
# grouping is enough: same-continent crews and plants are treated as the same
# service region (e.g. a Colombia-based crew could service a Chile plant).
REGION_CONTINENT = {
    'Arizona, USA': 'North America',
    'Rajasthan, India': 'Asia',
    'Andalusia, Spain': 'Europe',
    'Atacama, Chile': 'South America',
    'Queensland, AUS': 'Oceania',
}

HOME_BASE_CONTINENT = {
    'Phoenix, AZ': 'North America',
    'Jodhpur, RJ': 'Asia',
    'Seville, ES': 'Europe',
    'Antofagasta, CL': 'South America',
    'Townsville, QLD': 'Oceania',
    'Tucson, AZ': 'North America',
}


class Command(BaseCommand):
    help = (
        'Regenerates the fleet CSVs via seed_data.py and imports them: plants, crews, '
        'daily telemetry/events, a placeholder row for today, per-day days-until-next-reset, '
        'region-based crew-to-plant assignment, and a set of pre-determined dev users '
        '(one admin scoped to every plant, plus a batch of plant-owner users).'
    )

    def add_arguments(self, parser):
        repo_root = settings.BASE_DIR.parent
        parser.add_argument('--data-dir', default=str(repo_root / 'data'))
        parser.add_argument('--plants', type=int, default=12)
        parser.add_argument('--days', type=int, default=120)
        parser.add_argument('--seed', type=int, default=20260901)
        parser.add_argument(
            '--skip-reseed', action='store_true',
            help='Import the existing data dir as-is, without regenerating it first.',
        )

    def handle(self, *args, **options):
        today = date.today()
        data_dir = Path(options['data_dir'])

        if not options['skip_reseed']:
            self.regenerate_csvs(data_dir, options)

        with transaction.atomic():
            Plant.objects.all().delete()
            Crew.objects.all().delete()
            User.objects.all().delete()

            plants_by_id, reset_days_by_id = self.import_plants(data_dir)
            crews_by_id = self.import_crews(data_dir)
            plant_days_by_key = self.import_daily(data_dir, plants_by_id)
            self.import_events(data_dir, plant_days_by_key)
            self.add_today_rows(plants_by_id, reset_days_by_id, today)
            for plant in plants_by_id.values():
                PlantDay.backfill_days_until_next_reset(plant)
            self.assign_crews_by_region(crews_by_id, plants_by_id)
            user_count = self.create_users(plants_by_id, options['seed'])

        self.stdout.write(self.style.SUCCESS(
            f'Imported {len(plants_by_id)} plants, {len(crews_by_id)} crews and '
            f'{user_count + 1} users for {today.isoformat()}.'
        ))

    def regenerate_csvs(self, data_dir, options):
        seed_script = settings.BASE_DIR.parent / 'seed_data.py'
        subprocess.run(
            [
                sys.executable, str(seed_script),
                '--plants', str(options['plants']),
                '--days', str(options['days']),
                '--seed', str(options['seed']),
                '--out', str(data_dir),
            ],
            check=True,
        )

    def import_plants(self, data_dir):
        with open(data_dir / 'plants.csv', newline='') as f:
            rows = list(csv.DictReader(f))
        plants = Plant.objects.bulk_create(Plant.from_csv_row(row) for row in rows)
        plants_by_id = {row['plant_id']: plant for row, plant in zip(rows, plants)}
        reset_days_by_id = {row['plant_id']: int(row['days_until_next_reset']) for row in rows}
        return plants_by_id, reset_days_by_id

    def import_crews(self, data_dir):
        with open(data_dir / 'crews.csv', newline='') as f:
            rows = list(csv.DictReader(f))
        crews = Crew.objects.bulk_create(Crew.from_csv_row(row) for row in rows)
        return {row['crew_id']: crew for row, crew in zip(rows, crews)}

    def import_daily(self, data_dir, plants_by_id):
        with open(data_dir / 'daily.csv', newline='') as f:
            rows = []
            for row in csv.DictReader(f):
                if row['plant_id'] not in plants_by_id:
                    self.stdout.write(self.style.WARNING(
                        f"daily.csv: unknown plant_id {row['plant_id']!r}, skipping"
                    ))
                    continue
                rows.append(row)
        plant_days = PlantDay.objects.bulk_create(
            PlantDay.from_csv_row(row, plants_by_id[row['plant_id']]) for row in rows
        )
        return {(row['plant_id'], row['date']): plant_day for row, plant_day in zip(rows, plant_days)}

    def import_events(self, data_dir, plant_days_by_key):
        with open(data_dir / 'events.csv', newline='') as f:
            rows = []
            for row in csv.DictReader(f):
                key = (row['plant_id'], row['date'])
                if key not in plant_days_by_key:
                    self.stdout.write(self.style.WARNING(
                        f"events.csv: no matching daily.csv row for plant {row['plant_id']!r} "
                        f"on {row['date']}, skipping"
                    ))
                    continue
                rows.append(row)
        PlantDayEvent.objects.bulk_create(
            PlantDayEvent.from_csv_row(row, plant_days_by_key[(row['plant_id'], row['date'])])
            for row in rows
        )

    def add_today_rows(self, plants_by_id, reset_days_by_id, today):
        candidates = [
            (plant_id, plant) for plant_id, plant in plants_by_id.items()
            if plant.creation_date.date() <= today
        ]
        today_rows = PlantDay.objects.bulk_create(
            PlantDay.build_today(plant, today, reset_days_by_id[plant_id])
            for plant_id, plant in candidates
        )
        PlantDayEvent.objects.bulk_create(
            PlantDayEvent(plant_day=day, rain_mm=0, cleaned=False) for day in today_rows
        )

    def assign_crews_by_region(self, crews_by_id, plants_by_id):
        plants = list(plants_by_id.values())
        for crew in crews_by_id.values():
            continent = HOME_BASE_CONTINENT.get(crew.home_base)
            if continent is None:
                self.stdout.write(self.style.WARNING(
                    f'crews.csv: unknown home_base {crew.home_base!r}, no plants assigned'
                ))
                continue
            matching = [p for p in plants if REGION_CONTINENT.get(p.region) == continent]
            crew.assign_serviceable_plants(matching)

    def create_users(self, plants_by_id, seed):
        plants = list(plants_by_id.values())

        admin = User.objects.create_user(
            username=ADMIN_USERNAME, password=ADMIN_PASSWORD,
            is_staff=True, is_superuser=True,
        )
        admin.assign_plants(plants)

        user_count = round(len(plants) * USER_POPULATION_RATIO)
        two_plant_count = user_count // 2
        rng = random.Random(seed)
        for i in range(1, user_count + 1):
            user = User.objects.create_user(username=f'user{i}', password=USER_PASSWORD)
            owned = rng.sample(plants, 2 if i <= two_plant_count else 1)
            user.assign_plants(owned)
        return user_count
