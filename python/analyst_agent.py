import json
import time
import traceback
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from pydantic import BaseModel

from creator_profile import DerivedCreatorProfile
import llm_service


class CanSmallCreatorWin(BaseModel):
    verdict: str  # "YES / HARD / NO"
    confidence: str  # "LOW / MEDIUM / HIGH"


class AnalystAgentOutput(BaseModel):
    market_truth: str
    dominant_force: str
    opportunity: str
    risk: str
    content_gaps: List[str]
    can_small_creator_win: CanSmallCreatorWin
    reasoning: str


def run_analyst_agent(
    idea: str,
    features: dict,
    creator_profile: Optional[DerivedCreatorProfile],
    is_monopoly: bool = False,
    is_personality: bool = False,
    is_fragmented: bool = False,
) -> dict:
    print("[analyst] starting...")
    t0 = time.monotonic()

    creator_mode = "generic"
    subscriber_count = None
    channel_size_bucket = "small"
    growth_stage = "early"
    competition_tolerance = "low"
    performance_ratio = 0.0

    if creator_profile is not None:
        creator_mode = creator_profile.mode
        subscriber_count = creator_profile.subscriber_count
        channel_size_bucket = creator_profile.channel_size_bucket
        growth_stage = creator_profile.growth_stage
        competition_tolerance = creator_profile.competition_tolerance
        performance_ratio = creator_profile.performance_ratio

    system_prompt = (
        "You are a YouTube market analyst.\n\n"
        "Your job is to:\n"
        "* Understand the competitive landscape\n"
        "* Identify real opportunities\n"
        "* Detect risks\n\n"
        "STRICT RULES:\n"
        "* Do NOT generate titles or creative ideas\n"
        "* Do NOT give generic advice\n"
        "* Base your reasoning ONLY on provided data\n"
        "* Be sharp, specific, and slightly brutal\n"
        "* market_truth must be 1-2 lines max and MUST include:\n"
        "  - who dominates\n"
        "  - what works\n"
        "  - what fails\n"
        "* content_gaps must be specific and actionable (no generic placeholders)\n"
    )

    # Add transcript sample if available
    transcript_sample = features.get("transcript_sample", "")

    breakout_summary = features.get("breakout_summary")
    creator_distribution = features.get("creator_distribution")
    title_patterns = features.get("title_patterns")
    content_clusters = features.get("content_clusters")
    freshness = features.get("freshness")
    velocity_metrics = features.get("velocity_metrics")
    market_summary = features.get("market_summary", {}) or {}
    entry_barrier = market_summary.get("entry_barrier")
    competition_level = market_summary.get("competition_level")

    user_prompt = (
        f"Idea:\n{idea}\n\n"
        "Market Signals:\n"
        f"* Breakout Summary: {breakout_summary}\n"
        f"* Creator Distribution: {creator_distribution}\n"
        f"* Title Patterns: {title_patterns}\n"
        f"* Content Clusters: {content_clusters}\n"
        f"* Freshness: {freshness}\n"
        f"* Velocity Metrics: {velocity_metrics}\n"
        f"* Consistency: {features.get('consistency')}\n"
        f"* Market Dynamics: {features.get('market_dynamics')}\n"
        f"* Anomaly Signals: MONOPOLY={is_monopoly}, PERSONALITY_DRIVEN={is_personality}, FRAGMENTED={is_fragmented}\n\n"
        "TRANSCRIPT ANALYSIS:\n"
        f"- Hook Style: {features.get('transcript_analysis', {}).get('transcript_summary', {}).get('hook_style', 'Unknown')}\n"
        f"- Pacing: {features.get('transcript_analysis', {}).get('transcript_summary', {}).get('pacing', 'Unknown')}\n"
        f"- Tone: {features.get('transcript_analysis', {}).get('transcript_summary', {}).get('tone', 'Unknown')}\n\n"
        "CRITICAL SIGNALS:\n"
        f"- Entry Barrier: {entry_barrier}\n"
        f"- Competition Level: {competition_level}\n\n"
        "IMPORTANT SIGNAL INTERPRETATION RULES:\n"
        "CRITICAL SIGNALS MUST BE CONSIDERED:\n"
        "- Entry Barrier: HIGH = extremely difficult for new creators\n"
        "- Competition Level: HIGH = dominated by established players\n"
        "\n"
        "DETAILED RULES:\n"
        "- If Market Summary.entry_barrier = 'HIGH' -> assume difficult for small creators.\n"
        "- If creator_distribution.small_creator_success_rate = 'LOW' -> assume low breakout chances.\n"
        "- If Freshness.trend_status = 'STALE' -> assume the trend is declining.\n"
        "- If breakout_summary.distribution.viral is low (e.g., 0-1) -> assume low upside.\n"
        "- If velocity_metrics.avg_views_per_day < 1000 -> assume low engagement potential.\n"
        "- If velocity_metrics.top_vs_avg_ratio > 10 -> assume winner-takes-all market.\n"
        "- If velocity_metrics.avg_title_length > 60 -> assume clickbait-heavy niche.\n"
        "- If consistency.consistency = 'HIGH' -> stable market, predictable performance\n"
        "- If consistency.consistency = 'LOW' -> volatile market, high risk/reward\n"
        "- If market_dynamics = 'WINNER_TAKES_ALL' -> dominated by top players\n"
        "- If market_dynamics = 'VOLATILE' -> unpredictable performance swings\n"
        "- If market_dynamics = 'STABLE' -> predictable performance patterns\n"
        "- If transcript_analysis.hook_style = 'sensational' → high engagement but low retention\n"
        "- If transcript_analysis.pacing = 'fast' → appeals to shorter attention spans\n"
        "- If transcript_analysis.tone = 'direct_address' → builds stronger connection\n"
        "- If MONOPOLY=True -> market dominated by few players, entry is extremely hard.\n"
        "- If PERSONALITY_DRIVEN=True -> success depends on personal brand, not content quality.\n"
        "- If FRAGMENTED=True -> many small players, opportunity exists if you differentiate.\n"
        "Use these signals STRICTLY in your reasoning.\n\n"
        "Creator Context:\n"
        f"* Mode: {creator_mode}\n"
        f"* Subscribers: {subscriber_count}\n"
        f"* Channel Size: {channel_size_bucket}\n"
        f"* Growth Stage: {growth_stage}\n"
        f"* Performance Ratio: {performance_ratio}\n"
        f"* Competition Tolerance: {competition_tolerance}\n"
        "\n"
        "CREATOR PROFILE ADJUSTMENT RULES:\n"
        "- If performance_ratio is low (<0.1) → prioritize safer, proven ideas\n"
        "- If growth_stage is 'early' → avoid high competition niches\n"
        "- If channel_size_bucket is 'small' → focus on differentiation, not volume\n"
        "- If competition_tolerance is 'low' → avoid saturated markets\n"
        "Apply these rules to your analysis."
    )

    model = genai.GenerativeModel(
        llm_service._MODEL_NAME,  # reuse existing model name
        system_instruction=system_prompt,
    )
    try:
        response = llm_service.generate_content_with_timeout(
            model,
            user_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
                response_schema=AnalystAgentOutput,
            ),
            timeout_s=90,
        )
    except Exception:
        traceback.print_exc()
        result = {
            "market_truth": "Unknown",
            "dominant_force": "Unknown",
            "opportunity": "Insufficient signals to judge.",
            "risk": "Risk cannot be assessed.",
            "content_gaps": [],
            "can_small_creator_win": {"verdict": "HARD", "confidence": "LOW"},
            "reasoning": "LLM request timed out or failed.",
        }
        print({
            "stage": "analyst",
            "idea": idea,
            "output": result,
        })
        print(f"[analyst] done in {time.monotonic() - t0:.1f}s")
        return result

    raw_text = response.text or ""

    try:
        parsed = llm_service._parse(raw_text, AnalystAgentOutput)
        result = parsed.model_dump()
    except Exception:
        traceback.print_exc()
        # Fallback: attempt a simple JSON extraction; otherwise return safe defaults.
        try:
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            obj = json.loads(raw_text[start : end + 1])
            result = AnalystAgentOutput.model_validate(obj).model_dump()
        except Exception:
            traceback.print_exc()
            result = {
                "market_truth": "Unknown",
                "dominant_force": "Unknown",
                "opportunity": "Insufficient signals to judge.",
                "risk": "Risk cannot be assessed.",
                "content_gaps": [],
                "can_small_creator_win": {"verdict": "HARD", "confidence": "LOW"},
                "reasoning": "LLM output could not be parsed reliably.",
            }

    print({
        "stage": "analyst",
        "idea": idea,
        "output": result
    })
    print(f"[analyst] done in {time.monotonic() - t0:.1f}s")
    return result

