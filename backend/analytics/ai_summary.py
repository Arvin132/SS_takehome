"""Prompt building and the Gemini call for the per-plant-day AI summary feature.

Callers (analytics.tasks) are responsible for fetching/locking/saving; this module only
turns already-fetched data into a prompt and returns the model's plain-text summary.
"""

from dataclasses import dataclass
from decimal import Decimal

from django.conf import settings
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

SYSTEM_PROMPT = (
    "You are a solar plant operations assistant. Write a short, factual summary of a "
    "single plant's day for an asset manager deciding whether to send a cleaning crew.\n"
    "Rules:\n"
    "- Only use the facts given below. Never invent a number, crew, date, or event that "
    "is not present in them.\n"
    "- If a value is missing or null, say it is unavailable instead of guessing or "
    "estimating it yourself.\n"
    "- Do not recommend an action beyond what the given recommendation/assignment data "
    "already states.\n"
    "- Plain prose only: 3-5 sentences, no markdown, no headers, no bullet points."
)


@dataclass(frozen=True)
class DaySummaryContext:
    plant_name: str
    plant_region: str
    capacity_mw: Decimal
    tariff_per_kwh: Decimal
    cleaning_cost_usd: Decimal
    days_until_next_reset: int
    today: 'DayFacts'
    history: list['DayFacts']
    recommendation: 'RecommendationFacts | None'
    assignment: 'AssignmentFacts | None'


@dataclass(frozen=True)
class DayFacts:
    date: str
    energy_kwh: Decimal
    expected_energy_kwh: Decimal
    performance_ratio: Decimal | None
    soiling_loss_pct: Decimal | None
    rain_mm: Decimal
    cleaned: bool


@dataclass(frozen=True)
class RecommendationFacts:
    estimate_loss_usd: Decimal
    estimate_loss_kwh: Decimal
    estimate_recovery_usd: Decimal
    cleaning_cost_usd: Decimal
    recommended_crew_home_base: str | None


@dataclass(frozen=True)
class AssignmentFacts:
    crew_home_base: str
    estimate_days: int
    estimate_cost_usd: Decimal


def _format_day(label, day: DayFacts) -> str:
    return (
        f"{label} ({day.date}): energy {day.energy_kwh} kWh vs expected {day.expected_energy_kwh} kWh, "
        f"performance ratio {day.performance_ratio if day.performance_ratio is not None else 'unavailable'}, "
        f"soiling loss {day.soiling_loss_pct if day.soiling_loss_pct is not None else 'unavailable'}%, "
        f"rain {day.rain_mm}mm, cleaned by a crew: {'yes' if day.cleaned else 'no'}."
    )


def build_prompt_body(context: DaySummaryContext) -> str:
    lines = [
        f"Plant: {context.plant_name} ({context.plant_region}), capacity {context.capacity_mw} MW, "
        f"tariff {context.tariff_per_kwh} USD/kWh, cleaning cost {context.cleaning_cost_usd} USD, "
        f"days until next natural reset (rain): {context.days_until_next_reset}.",
        "",
        _format_day('Today', context.today),
    ]

    for offset, day in enumerate(reversed(context.history), start=1):
        lines.append(_format_day(f'{offset} day(s) before today', day))

    if context.recommendation:
        rec = context.recommendation
        lines.append(
            f"Today's recommendation: estimated loss {rec.estimate_loss_usd} USD "
            f"({rec.estimate_loss_kwh} kWh), cleaning cost {rec.cleaning_cost_usd} USD, "
            f"net recoverable value {rec.estimate_recovery_usd} USD, "
            f"recommended crew: {rec.recommended_crew_home_base or 'none worth dispatching'}."
        )
    else:
        lines.append("Today's recommendation: not yet computed.")

    if context.assignment:
        a = context.assignment
        lines.append(
            f"A crew is already assigned today: {a.crew_home_base}, "
            f"estimated {a.estimate_days} day(s) at {a.estimate_cost_usd} USD."
        )
    else:
        lines.append("No crew is currently assigned today.")

    return "\n".join(lines)


def get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.2,
    )


def generate_summary(context: DaySummaryContext) -> str:
    llm = get_llm()
    response = llm.invoke([SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=build_prompt_body(context))])
    return str(response.content).strip()
