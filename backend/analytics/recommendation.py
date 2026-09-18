"""Pure computation for the daily soiling/cleaning recommendation.

Nothing here touches the database. Callers (a management command, an API view, a
Django-Q task) are responsible for fetching/prefetching Plant, PlantDay, PlantDayEvent
and Crew rows and mapping them onto the dataclasses below, so this module can be reused
against ORM data, batched/bulk-loaded data, or test fixtures alike.
"""

from dataclasses import dataclass
from decimal import Decimal
from math import ceil
from typing import Callable, Iterable

from core.models import RAIN_RESET_THRESHOLD_MM

TREND_LOOKBACK_DAYS = 14

ZERO = Decimal('0')
HUNDRED = Decimal('100')


@dataclass(frozen=True)
class PlantDayHistoryEntry:
    """One past day of telemetry for a plant. Callers must pass these oldest-to-newest,
    one per calendar day (gaps are tolerated but not corrected for)."""
    expected_energy_kwh: Decimal
    soiling_loss_pct: Decimal | None
    performance_ratio: Decimal | None
    rain_mm: Decimal
    cleaned: bool


@dataclass(frozen=True)
class CrewOption:
    crew_id: int
    mw_per_day: Decimal
    day_rate_usd: Decimal


@dataclass(frozen=True)
class PlantSnapshot:
    capacity_mw: Decimal
    tariff_per_kwh: Decimal
    days_until_next_reset: int


@dataclass(frozen=True)
class CrewCleaningPlan:
    crew: CrewOption
    clean_days: int
    effective_days: int
    rain_cuts_cleaning_short: bool
    cleaning_cost_usd: Decimal
    savings_usd: Decimal

    @property
    def net_gain_usd(self) -> Decimal:
        return self.savings_usd - self.cleaning_cost_usd


@dataclass(frozen=True)
class SoilingRecommendation:
    estimated_soiling_loss_pct: Decimal
    estimated_performance_ratio: Decimal | None
    estimated_expected_energy_kwh: Decimal
    estimate_loss_kwh: Decimal
    estimate_loss_usd: Decimal
    crew_plans: list[CrewCleaningPlan]
    best_plan: CrewCleaningPlan | None

    @property
    def recommended_crew(self) -> CrewOption | None:
        if self.best_plan and self.best_plan.net_gain_usd > ZERO:
            return self.best_plan.crew
        return None

    @property
    def estimate_recovery_usd(self) -> Decimal:
        return self.best_plan.net_gain_usd if self.best_plan else ZERO

    @property
    def cleaning_cost_usd(self) -> Decimal:
        return self.best_plan.cleaning_cost_usd if self.best_plan else ZERO


def _mean(values: Iterable[Decimal]) -> Decimal | None:
    values = list(values)
    return sum(values, ZERO) / len(values) if values else None


def _daily_trend(
    history: list[PlantDayHistoryEntry],
    value_of: Callable[[PlantDayHistoryEntry], Decimal | None],
    higher_is_better: bool,
) -> tuple[Decimal, Decimal]:
    """Mean day-over-day change on dry days, plus mean per-mm benefit on days with
    sub-threshold rain (a full reset day's delta isn't part of the accumulation trend)."""
    known = [(entry, value_of(entry)) for entry in history]
    pairs = [
        (prev, curr_value - prev_value)
        for (prev, prev_value), (_, curr_value) in zip(known, known[1:])
        if prev_value is not None and curr_value is not None
        and not prev.cleaned and prev.rain_mm < RAIN_RESET_THRESHOLD_MM
    ]
    dry_rate = _mean(delta for prev, delta in pairs if prev.rain_mm == ZERO) or ZERO

    sign = Decimal('1') if higher_is_better else Decimal('-1')
    rain_benefits = [
        sign * (delta - dry_rate) / prev.rain_mm
        for prev, delta in pairs if ZERO < prev.rain_mm
    ]
    rain_benefit_per_mm = max(_mean(rain_benefits) or ZERO, ZERO)
    return dry_rate, rain_benefit_per_mm


def _project_today(
    history: list[PlantDayHistoryEntry],
    value_of: Callable[[PlantDayHistoryEntry], Decimal | None],
    higher_is_better: bool,
    today_rain_mm: Decimal,
    floor: Decimal,
    ceiling: Decimal | None = None,
) -> Decimal | None:
    values = [value_of(entry) for entry in history]
    known = [value for value in values if value is not None]
    if not known:
        return None

    dry_rate, rain_benefit_per_mm = _daily_trend(history, value_of, higher_is_better)
    sign = Decimal('1') if higher_is_better else Decimal('-1')
    projected = known[-1] + dry_rate + sign * rain_benefit_per_mm * today_rain_mm

    projected = max(projected, floor)
    return min(projected, ceiling) if ceiling is not None else projected


def _plan_crew_cleaning(
    crew: CrewOption,
    plant: PlantSnapshot,
    soiling_loss_pct: Decimal,
    expected_energy_kwh_daily: Decimal,
) -> CrewCleaningPlan:
    """Savings vs. doing nothing, assuming soiling stays at today's estimate for the
    horizon and drops off linearly while a crew is actively cleaning. If rain will
    reset the plant before the crew finishes, the horizon (and the job) is cut to the
    day rain hits instead of running the full cleaning."""
    clean_days = max(1, ceil(plant.capacity_mw / crew.mw_per_day))
    daily_loss_usd = expected_energy_kwh_daily * (soiling_loss_pct / HUNDRED) * plant.tariff_per_kwh
    horizon = plant.days_until_next_reset

    if horizon <= 0:
        return CrewCleaningPlan(crew, clean_days, 0, True, ZERO, ZERO)

    if horizon <= clean_days:
        effective_days = horizon
        fraction_complete = Decimal(effective_days) / Decimal(clean_days)
        avg_soiling_during = soiling_loss_pct * (Decimal('1') - fraction_complete / Decimal('2'))
        loss_during = expected_energy_kwh_daily * (avg_soiling_during / HUNDRED) * plant.tariff_per_kwh
        savings = daily_loss_usd * effective_days - loss_during * effective_days
        cost = Decimal(effective_days) * crew.day_rate_usd
        return CrewCleaningPlan(crew, clean_days, effective_days, True, cost, savings)

    remaining_days = horizon - clean_days
    savings_during_cleaning = daily_loss_usd * clean_days / Decimal('2')
    savings_after_cleaning = daily_loss_usd * remaining_days
    cost = Decimal(clean_days) * crew.day_rate_usd
    return CrewCleaningPlan(
        crew, clean_days, clean_days, False, cost, savings_during_cleaning + savings_after_cleaning,
    )


def recommend_cleaning(
    plant: PlantSnapshot,
    history: list[PlantDayHistoryEntry],
    crews: list[CrewOption],
    today_rain_mm: Decimal = ZERO,
    lookback_days: int = TREND_LOOKBACK_DAYS,
) -> SoilingRecommendation:
    """Entry point: estimate today's soiling/PR/expected-energy from history, then
    score every crew capable of servicing the plant and keep the best net gain.
    Pass in prefetched/batched data only -- no queries happen in here."""
    window = history[-lookback_days:]

    soiling_loss_pct = _project_today(
        window, lambda e: e.soiling_loss_pct, higher_is_better=False,
        today_rain_mm=today_rain_mm, floor=ZERO, ceiling=HUNDRED,
    ) or ZERO

    performance_ratio = _project_today(
        window, lambda e: e.performance_ratio, higher_is_better=True,
        today_rain_mm=today_rain_mm, floor=ZERO,
    )

    expected_energy_kwh = _mean(e.expected_energy_kwh for e in window) or ZERO

    estimate_loss_kwh = expected_energy_kwh * (soiling_loss_pct / HUNDRED)
    estimate_loss_usd = estimate_loss_kwh * plant.tariff_per_kwh

    crew_plans = [
        _plan_crew_cleaning(crew, plant, soiling_loss_pct, expected_energy_kwh)
        for crew in crews
    ]
    best_plan = max(crew_plans, key=lambda p: p.net_gain_usd, default=None)

    return SoilingRecommendation(
        estimated_soiling_loss_pct=soiling_loss_pct,
        estimated_performance_ratio=performance_ratio,
        estimated_expected_energy_kwh=expected_energy_kwh,
        estimate_loss_kwh=estimate_loss_kwh,
        estimate_loss_usd=estimate_loss_usd,
        crew_plans=crew_plans,
        best_plan=best_plan,
    )
