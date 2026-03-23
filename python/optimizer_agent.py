from __future__ import annotations

import json
import time
import traceback
from typing import List, Optional

import google.generativeai as genai
from pydantic import BaseModel

from creator_profile import DerivedCreatorProfile
import llm_service


class FinalVerdict(BaseModel):
    decision: str  # "GO / MODIFY / AVOID"
    confidence: str  # "LOW / MEDIUM / HIGH"
    reason: str


class ExecutionPlan(BaseModel):
    title: str
    hook: str
    thumbnail_concept: str
    video_structure: List[str]


class PerformanceOutlook(BaseModel):
    potential: str  # "LOW / MEDIUM / HIGH"
    risk: str  # "LOW / MEDIUM / HIGH"
    reason: str


class OptimizerLLMOutput(BaseModel):
    executive_summary: str
    key_insight: str
    final_verdict: FinalVerdict
    execution_plan: ExecutionPlan
    next_moves: List[str]
    avoid: List[str]
    performance_outlook: PerformanceOutlook
    why_this_will_work: str


class OptimizerAgentOutput(OptimizerLLMOutput):
    gap_exploited: Optional[str] = None
    is_reliable: bool = True
    warning: Optional[str] = None


def run_optimizer_agent(
    idea: str,
    analyst_output: dict,
    strategist_output: dict,
    creator_profile: Optional[DerivedCreatorProfile],
) -> dict:
    print("[optimizer] starting...")
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
        "You are a YouTube execution expert.\n\n"
        "Your job is to:\n"
        "* Convert strategy into clear actions\n"
        "* Decide if the idea is worth pursuing\n"
        "* Make output practical and decisive\n\n"
        "STRICT RULES:\n"
        "* Be direct and decisive\n"
        "* Avoid generic advice\n"
        "* Focus on execution, not theory\n\n"
        "DECISION AUTHORITY RULE:\n"
        "* You MUST make a clear decision in final_verdict.decision: GO / MODIFY / AVOID.\n"
        "* Do NOT be neutral or vague.\n"
        "* Do NOT hedge with uncertainty.\n"
        "* If you are unsure, choose MODIFY and explain why.\n\n"
        "TITLE QUALITY RULE:\n"
        "* title must create curiosity OR a strong benefit.\n"
        "* title must NOT be generic.\n"
        "* title must NOT just repeat the dominant pattern from the niche.\n\n"
        "HOOK QUALITY RULE:\n"
        "* hook must create tension in the first sentence.\n"
        "* hook must NOT be explanatory.\n"
        "* hook must NOT start with 'In this video...'.\n\n"
        "AVOID RULE:\n"
        "* avoid must include at least 1 common mistake in this niche.\n"
        "* avoid must include at least 1 mistake that is specific to THIS idea.\n\n"
        "PERFORMANCE OUTLOOK RULE:\n"
        "* performance_outlook.reason must explain causally why potential is high/low.\n"
        "* Reference competition level and observed patterns from the analyst/strategist context.\n\n"
        "EXECUTIVE SUMMARY RULE:\n"
        "* executive_summary must be exactly 1-2 punchy sentences summarizing the verdict and the required action.\n"
        "* If decision is GO: Frame it as 'Here is your opportunity and exactly how to take it.'\n"
        "* If decision is MODIFY: Frame it as 'Strong idea, wrong angle. Here is the specific shift that changes everything.'\n"
        "* If decision is AVOID: Frame it as 'We strongly advise against this idea due to market conditions. However, if you are absolutely forced to make this video, here is your only survival strategy.'\n\n"
        "AVOID VERDICT RULE:\n"
        "* If your decision is AVOID, you MUST STILL generate a complete and brilliant execution_plan.\n"
        "* Frame the execution plan as a 'Risk Mitigation' or 'Survival' strategy.\n"
        "* The execution plan must represent the absolute best-case scenario for a fundamentally bad idea.\n\n"
        "KEY INSIGHT:\n"
        "* key_insight must be exactly 1 line and feel like a premium, memorable summary.\n\n"
        "WHY THIS WILL WORK:\n"
        "* Provide a clear causal chain:\n"
        "  gap → differentiation → CTR → retention → growth\n"
        "* Must NOT be generic\n\n"
        "SELF-CHECK QUALITY VALIDATION:\n"
        "Before finalizing your output, you MUST perform this self-check:\n"
        "- If title feels generic → rewrite it to be more specific and compelling\n"
        "- If hook lacks tension → rewrite it to create immediate curiosity\n"
        "- If advice is obvious → rewrite it to provide non-obvious insights\n"
        "- If thumbnail_concept is vague → rewrite it to be visually specific\n"
        "- If video_structure is generic → rewrite it to include unique elements\n"
        "- If next_moves feel generic → rewrite them to be actionable and specific\n"
        "Only after passing this self-check should you finalize your response.\n\n"
        "GAP ENFORCEMENT RULE:\n"
        "* If strategist_output.gap_exploited is NOT empty or 'Unknown', you MUST use it.\n"
        "* Execution MUST clearly reflect this gap.\n"
        "* If the gap is empty, focus on radical differentiation instead.\n\n"
        "ANALYST OVERRIDE RULE:\n"
        "* If analyst_output indicates:\n"
        "  - low demand\n"
        "  - high competition\n"
        "  - high risk\n"
        "→ you MUST reflect that in final_verdict\n"
        "* You cannot contradict analyst unless explicitly justified."
    )

    user_prompt = (
        f"Idea:\n{idea}\n\n"
        "Analyst Output:\n"
        f"{json.dumps(analyst_output, indent=2)}\n\n"
        "Strategist Output:\n"
        f"{json.dumps(strategist_output, indent=2)}\n\n"
        "Creator Context:\n"
        f"* Mode: {creator_mode}\n"
        f"* Channel Size: {channel_size_bucket}\n"
        f"* Growth Stage: {growth_stage}\n"
        f"* Performance Ratio: {performance_ratio}\n"
        f"* Competition Tolerance: {competition_tolerance}\n"
        f"* Analyst Reasoning: {analyst_output.get('reasoning')}\n"
        f"* Strategist Reasoning: {strategist_output.get('reasoning')}\n"
        f"* Gap To Exploit: {strategist_output.get('gap_exploited')}\n"
        "\n"
        "CREATOR PROFILE ADJUSTMENT RULES:\n"
        "- If performance_ratio is low (<0.1) → prioritize safer, proven ideas\n"
        "- If growth_stage is 'early' → avoid high competition niches\n"
        "- If channel_size_bucket is 'small' → focus on differentiation, not volume\n"
        "- If competition_tolerance is 'low' → avoid saturated markets\n"
        "Apply these rules to your execution plan."
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
                temperature=0.7,
                response_mime_type="application/json",
                response_schema=OptimizerLLMOutput,
            ),
            timeout_s=60,
        )
    except Exception:
        traceback.print_exc()
        result = {
            "executive_summary": "System overloaded. Please try again.",
            "key_insight": "Entry angle exists, but only if you differentiate hard from the default creator playbook.",
            "final_verdict": {
                "decision": "MODIFY",
                "confidence": "LOW",
                "reason": "LLM request timed out or failed.",
            },
            "execution_plan": {
                "title": "N/A",
                "hook": "N/A",
                "thumbnail_concept": "N/A",
                "video_structure": [],
            },
            "next_moves": [],
            "avoid": [],
            "performance_outlook": {
                "potential": "LOW",
                "risk": "MEDIUM",
                "reason": "No reliable execution guidance available.",
            },
            "why_this_will_work": "Unable to generate reliable execution plan due to timeout/failure.",
            "gap_exploited": strategist_output.get("gap_exploited") or "Unknown",
            "is_reliable": False,
            "warning": "Low confidence output. Retry recommended.",
        }
        print({
            "stage": "optimizer",
            "idea": idea,
            "output": result,
        })
        print(f"[optimizer] done in {time.monotonic() - t0:.1f}s")
        return result

    raw_text = response.text or ""

    parsed_successfully = False
    try:
        parsed = llm_service._parse(raw_text, OptimizerLLMOutput)
        result = parsed.model_dump()
        parsed_successfully = True
    except Exception:
        traceback.print_exc()
        try:
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            obj = json.loads(raw_text[start : end + 1])
            result = OptimizerAgentOutput.model_validate(obj).model_dump()
            parsed_successfully = True
        except Exception:
            traceback.print_exc()
            result = {
                "executive_summary": "System parsing failed. Please try again.",
                "key_insight": "Entry angle exists, but only if you differentiate hard from the default creator playbook.",
                "final_verdict": {
                    "decision": "MODIFY",
                    "confidence": "LOW",
                    "reason": "LLM output could not be parsed reliably.",
                },
                "execution_plan": {
                    "title": "N/A",
                    "hook": "N/A",
                    "thumbnail_concept": "N/A",
                    "video_structure": [],
                },
                "next_moves": [],
                "avoid": [],
                "performance_outlook": {
                    "potential": "LOW",
                    "risk": "MEDIUM",
                    "reason": "No reliable execution guidance available.",
                },
                "why_this_will_work": "Unable to generate reliable execution plan due to parsing failure.",
                "gap_exploited": "Unknown",
                "is_reliable": False,
                "warning": "Low confidence output. Retry recommended.",
            }
    
    result["is_reliable"] = parsed_successfully
    
    # Manually copy the gap from the Strategist so it doesn't show as null
    result["gap_exploited"] = strategist_output.get("gap_exploited", "Unknown")
    
    if parsed_successfully:
        # Analyst override enforcement
        analyst_win = str(analyst_output.get("can_small_creator_win", {}).get("verdict", "")).upper()
        decision = str(result.get("final_verdict", {}).get("decision", "")).upper()
        
        if "NO" in analyst_win and decision == "GO":
            result["final_verdict"]["decision"] = "MODIFY"
            result["final_verdict"]["reason"] = "Adjusted because analyst flagged low feasibility."

    # Failure escalation system
    if not result.get("is_reliable", True):
        # Always default to MODIFY for unreliable outputs
        if "final_verdict" in result and "decision" in result["final_verdict"]:
            if result["final_verdict"]["decision"] == "GO":
                result["final_verdict"]["decision"] = "MODIFY"
                result["final_verdict"]["reason"] = "Low confidence output. Retry recommended."
        
        # Add warning for frontend
        result["warning"] = "Low confidence output. Retry recommended."

    print({
        "stage": "optimizer",
        "idea": idea,
        "output": result
    })
    print(f"[optimizer] done in {time.monotonic() - t0:.1f}s")
    return result

