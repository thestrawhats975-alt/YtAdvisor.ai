from __future__ import annotations

import json
import time
import traceback
from typing import List, Optional

import google.generativeai as genai
from pydantic import BaseModel, Field

from creator_profile import DerivedCreatorProfile
import llm_service


class StrategistAgentOutput(BaseModel):
    positioning: str
    content_angle: str
    idea_upgrade: str
    differentiation_strategy: str
    gap_exploited: str
    next_video_ideas: List[str]
    reasoning: str


def run_strategist_agent(
    idea: str,
    analyst_output: dict,
    creator_profile: Optional[DerivedCreatorProfile],
) -> dict:
    print("[strategist] starting...")
    t0 = time.monotonic()

    creator_mode = "generic"
    channel_size_bucket = "small"
    competition_tolerance = "low"
    growth_stage = "early"
    performance_ratio = 0.0

    if creator_profile is not None:
        creator_mode = creator_profile.mode
        channel_size_bucket = creator_profile.channel_size_bucket
        competition_tolerance = creator_profile.competition_tolerance
        growth_stage = creator_profile.growth_stage
        performance_ratio = creator_profile.performance_ratio

    system_prompt = (
        "You are a YouTube content strategist.\n\n"
        "Your job is to:\n"
        "* Turn market insights into winning video ideas\n"
        "* Create strong positioning and angles\n"
        "* Exploit gaps and weaknesses\n\n"
        "STRICT RULES:\n"
        "* Do NOT repeat analysis\n"
        "* Do NOT give generic advice\n"
        "* Do NOT re-analyze the market.\n"
        "* Focus on DIFFERENTIATION.\n"
        "* Your strategy MUST be based on contrast.\n"
        "* Identify what most creators are doing.\n"
        "* Then deliberately propose a different angle.\n"
        "* If your idea sounds similar to existing content, it is WRONG.\n\n"
        "MANDATORY: CONTENT GAP EXPLOITATION\n"
        "* Your strategy MUST directly exploit at least one content gap from the analysis.\n"
        "* If you do not use a content gap, your strategy is INVALID.\n"
        "* Explicitly reference which content gap you are exploiting.\n"
        "* Your differentiation_strategy must explain HOW you exploit the gap.\n"
        "* Your idea_upgrade must be a direct response to the identified gap.\n\n"
        "MANDATORY GAP TRACEABILITY:\n"
        "* You MUST explicitly state which content gap you are exploiting.\n"
        "* gap_exploited must be a direct reference to one of the provided content_gaps.\n"
        "* differentiation_strategy MUST explain how this gap is exploited.\n"
        "* If no gap is used, your output is INVALID.\n\n"
        "RULES FOR OUTPUT FIELDS:\n"
        "* idea_upgrade must be a FULL improved video concept (not an explanation).\n"
        "* next_video_ideas must follow a progression (beginner → deeper → viral).\n"
        "* next_video_ideas must NOT be random; each idea must be clearly different in angle.\n"
        "* Provide reasoning as a short explanation why this strategy works.\n"
        "* Keep everything specific, sharp, and strategic.\n"
    )

    user_prompt = (
        "Idea:\n"
        f"{idea}\n\n"
        "Analyst Insights:\n"
        f"* Market Truth: {analyst_output.get('market_truth')}\n"
        f"* Dominant Force: {analyst_output.get('dominant_force')}\n"
        f"* Opportunity: {analyst_output.get('opportunity')}\n"
        f"* Risk: {analyst_output.get('risk')}\n"
        f"* Content Gaps: {analyst_output.get('content_gaps')}\n"
        f"* Can Win: {analyst_output.get('can_small_creator_win')}\n"
        f"* Reasoning: {analyst_output.get('reasoning')}\n\n"
        "Creator Context:\n"
        f"* Mode: {creator_mode}\n"
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
        "Apply these rules to your strategy."
    )

    model = genai.GenerativeModel(
        llm_service._MODEL_NAME,
        system_instruction=system_prompt,
    )
    try:
        response = llm_service.generate_content_with_timeout(
            model,
            user_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.8,
                response_mime_type="application/json",
                response_schema=StrategistAgentOutput,
            ),
            timeout_s=45,
        )
    except Exception:
        traceback.print_exc()
        result = {
            "positioning": "N/A",
            "content_angle": "N/A",
            "idea_upgrade": "N/A",
            "differentiation_strategy": "N/A",
            "gap_exploited": "Unknown",
            "next_video_ideas": [],
            "reasoning": "LLM request timed out or failed.",
        }
        print({
            "stage": "strategist",
            "idea": idea,
            "output": result,
        })
        print(f"[strategist] done in {time.monotonic() - t0:.1f}s")
        return result

    raw_text = response.text or ""

    try:
        parsed = llm_service._parse(raw_text, StrategistAgentOutput)
        result = parsed.model_dump()
    except Exception:
        traceback.print_exc()
        try:
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            obj = json.loads(raw_text[start : end + 1])
            result = StrategistAgentOutput.model_validate(obj).model_dump()
        except Exception:
            traceback.print_exc()
            result = {
                "positioning": "N/A",
                "content_angle": "N/A",
                "idea_upgrade": "N/A",
                "differentiation_strategy": "N/A",
                "gap_exploited": "Unknown",
                "next_video_ideas": [],
                "reasoning": "LLM output could not be parsed reliably.",
            }

    print({
        "stage": "strategist",
        "idea": idea,
        "output": result
    })
    print(f"[strategist] done in {time.monotonic() - t0:.1f}s")
    return result

