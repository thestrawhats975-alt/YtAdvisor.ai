import os
import sys
import time
import traceback
from types import SimpleNamespace

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

import google.generativeai as genai
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

from pydantic import BaseModel as _BaseModel
from typing import Optional as _Optional

from llm_service import expand_idea_to_queries
from competitor_scraper import (
    scrape_competitor_intelligence,
    intelligence_to_competitor_data,
    get_median_subscriber_count,
)
from market_graph import build_market_graph as analyse_market_graph
from thumbnail_analyzer import analyse_thumbnails

from api_models import (
    AgentContext,
    InitialRequest,
    DimenziqAnalysisOutput,
    VerdictSection,
    MarketSection,
    CreativeSection,
    ExecutionSection,
    GrowthSection,
    ContentGap,
    TitleVariant,
    RetentionTrap,
    NextVideoIdea,
    VerdictEnum,
    ConfidenceEnum,
    SmallCreatorVerdictEnum,
    ArchetypeEnum,
)
from analyst_agent import run_analyst_agent
from strategist_agent import run_strategist_agent
from optimizer_agent import run_optimizer_agent


class AutoAnalyzeRequest(_BaseModel):
    video_idea: str
    creator_dna: _Optional[str] = None


def _analyst_graph_view(mg) -> SimpleNamespace:
    """Maps MarketGraphSignals onto fields expected by run_analyst_agent graph prompt."""
    share = mg.monopoly_share_pct / 100.0
    return SimpleNamespace(
        market_structure_summary=(
            f"{mg.cluster_count} clusters; {mg.unique_channels} channels; "
            f"{mg.unique_categories} categories; fragmented={mg.is_fragmented}; "
            f"monopoly={mg.is_monopoly}; keyword_saturation={mg.keyword_saturation}"
        ),
        entry_opportunity_summary=(
            f"opportunity_cluster={mg.has_opportunity_cluster}; "
            f"bridge_videos={len(mg.bridge_video_ids)}; "
            f"keywords={','.join(mg.dominant_keywords[:8])}"
        ),
        small_creator_opportunity=mg.small_creator_success_rate,
        cluster_count=mg.cluster_count,
        monopoly_detected=mg.is_monopoly,
        monopoly_channel_share=share,
        breakout_concentration=f"{mg.market_dynamics} | {mg.breakout_distribution}",
        top_breakout_multiplier=mg.top_breakout_multiplier,
        avg_breakout_multiplier=mg.avg_breakout_multiplier,
        analyst_narrative=mg.analyst_summary,
    )


app = FastAPI(title="Dimenziq API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok", "product": "Dimenziq", "version": "2.0.0"}

@app.post("/api/v1/analyze", response_model=DimenziqAnalysisOutput)
def analyze(payload: AgentContext):
    try:
        analyst_result = run_analyst_agent(payload)
        strategist_result = run_strategist_agent(payload, analyst_result)
        optimizer_result = run_optimizer_agent(payload, analyst_result, strategist_result)

        output = DimenziqAnalysisOutput(
            verdict=VerdictSection(
                final_verdict=optimizer_result["final_verdict"],
                confidence=optimizer_result["confidence"],
                confidence_reason=optimizer_result["confidence_reason"],
                idea_upgrade=optimizer_result["idea_upgrade"],
                market_context=optimizer_result["market_context"],
                performance_benchmark=optimizer_result["performance_benchmark"],
                performance_outlook=optimizer_result["performance_outlook"],
                channel_strength=analyst_result["channel_strength"],
                channel_risk=analyst_result["channel_risk"],
            ),
            market=MarketSection(
                market_truth=analyst_result["market_truth"],
                dominant_force=analyst_result["dominant_force"],
                competitor_weakness=analyst_result["competitor_weakness"],
                audience_craving=analyst_result["audience_craving"],
                content_gaps=[
                    ContentGap(gap=g["gap"], source=g["source"])
                    for g in analyst_result.get("content_gaps", [])
                ],
                small_creator_verdict=analyst_result["small_creator_verdict"],
                small_creator_reason=analyst_result["small_creator_reason"],
                algorithm_signal=analyst_result["algorithm_signal"],
                satisfaction_risk=analyst_result["satisfaction_risk"],
                content_archetype=analyst_result["content_archetype"],
            ),
            creative=CreativeSection(
                suggested_title=strategist_result["suggested_title"],
                title_psychology=strategist_result["title_psychology"],
                title_alternatives=[
                    TitleVariant(title=t["title"], psychology_tag=t["psychology_tag"])
                    for t in strategist_result.get("title_alternatives", [])
                ],
                thumbnail_concept=strategist_result["thumbnail_concept"],
                thumbnail_contrast_rule=strategist_result["thumbnail_contrast_rule"],
                thumbnail_text_overlay=strategist_result.get("thumbnail_text_overlay", ""),
            ),
            execution=ExecutionSection(
                exact_hook_script=strategist_result["exact_hook_script"],
                hook_psychology=strategist_result["hook_psychology"],
                pacing_timeline=optimizer_result.get("pacing_timeline", []),
                retention_traps=[
                    RetentionTrap(
                        moment=r["moment"],
                        reason=r["reason"],
                        fix=r["fix"],
                    )
                    for r in optimizer_result.get("retention_traps", [])
                ],
                win_conditions=optimizer_result.get("win_conditions", []),
                fail_conditions=optimizer_result.get("fail_conditions", []),
                shorts_test_recommended=optimizer_result["shorts_test_recommended"],
                shorts_test_instruction=optimizer_result.get("shorts_test_instruction", ""),
            ),
            growth=GrowthSection(
                pinned_comment=optimizer_result["pinned_comment"],
                community_post_seed=optimizer_result["community_post_seed"],
                description_timestamps=optimizer_result["description_timestamps"],
                next_video_series=[
                    NextVideoIdea(
                        title=n["title"],
                        strategic_reason=n["strategic_reason"],
                        priority=n["priority"],
                    )
                    for n in optimizer_result.get("next_video_series", [])
                ],
                series_positioning=optimizer_result["series_positioning"],
            ),
        )

        return output

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.post("/api/v1/analyze/auto", response_model=DimenziqAnalysisOutput)
def analyze_auto(payload: AutoAnalyzeRequest):
    """
    Full Pipeline 1 endpoint. Takes only a video idea and optional creator DNA.
    Automatically runs competitor scraping, graph analysis, thumbnail vision,
    and all three AI agents. Returns DimenziqAnalysisOutput.
    """
    t_total = time.monotonic()

    try:
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

        # ── Stage 1: Query Expansion ──────────────────────────────────────
        print(f"[auto] starting pipeline for: {payload.video_idea[:60]}")
        t0 = time.monotonic()
        queries = expand_idea_to_queries(payload.video_idea)
        if not queries:
            queries = [payload.video_idea]
        print(f"[auto] queries expanded: {queries} ({time.monotonic() - t0:.1f}s)")

        # ── Stage 2: Competitor Scraping ──────────────────────────────────
        youtube_api_key = os.getenv("YOUTUBE_API_KEY")
        if not youtube_api_key:
            raise HTTPException(
                status_code=500,
                detail="YOUTUBE_API_KEY not set in environment.",
            )

        t0 = time.monotonic()
        intel = scrape_competitor_intelligence(queries, youtube_api_key)
        print(
            f"[auto] scraping complete: success={intel.scrape_successful}, "
            f"videos={len(intel.all_videos)} ({time.monotonic() - t0:.1f}s)"
        )

        if not intel.scrape_successful:
            raise HTTPException(
                status_code=400,
                detail=f"Competitor scraping failed: {intel.error_message}",
            )

        # ── Stage 3: Graph Analysis ───────────────────────────────────────
        t0 = time.monotonic()
        graph_signals = analyse_market_graph(intel)
        print(
            f"[auto] graph analysis complete: clusters={graph_signals.cluster_count}, "
            f"monopoly={graph_signals.is_monopoly} ({time.monotonic() - t0:.1f}s)"
        )

        # ── Stage 4: Thumbnail Vision Analysis ───────────────────────────
        t0 = time.monotonic()
        thumbnail_analysis = analyse_thumbnails(intel.top_thumbnail_urls)
        print(
            f"[auto] thumbnail analysis complete: success={thumbnail_analysis.analysis_successful} "
            f"({time.monotonic() - t0:.1f}s)"
        )

        # ── Stage 5: Build AgentContext from scraped data ─────────────────
        competitor_data = intelligence_to_competitor_data(intel)
        median_subs = get_median_subscriber_count(intel)

        agent_context = AgentContext(
            request=InitialRequest(
                video_idea=payload.video_idea,
                creator_dna=payload.creator_dna,
            ),
            competitors=competitor_data,
        )

        graph_for_analyst = _analyst_graph_view(graph_signals)

        # ── Stage 6: Run Analyst Agent ────────────────────────────────────
        t0 = time.monotonic()
        analyst_result = run_analyst_agent(
            agent_context,
            graph_signals=graph_for_analyst,
            median_subscriber_count=median_subs,
        )
        print(f"[auto] analyst complete ({time.monotonic() - t0:.1f}s)")

        # ── Stage 7: Run Strategist Agent ─────────────────────────────────
        t0 = time.monotonic()
        strategist_result = run_strategist_agent(
            agent_context,
            analyst_result,
            thumbnail_analysis=thumbnail_analysis,
        )
        print(f"[auto] strategist complete ({time.monotonic() - t0:.1f}s)")

        # ── Stage 8: Run Optimizer Agent ──────────────────────────────────
        t0 = time.monotonic()
        optimizer_result = run_optimizer_agent(
            agent_context,
            analyst_result,
            strategist_result,
        )
        print(f"[auto] optimizer complete ({time.monotonic() - t0:.1f}s)")

        # ── Stage 9: Assemble Output ──────────────────────────────────────
        output = DimenziqAnalysisOutput(
            verdict=VerdictSection(
                final_verdict=optimizer_result["final_verdict"],
                confidence=optimizer_result["confidence"],
                confidence_reason=optimizer_result["confidence_reason"],
                idea_upgrade=optimizer_result["idea_upgrade"],
                market_context=optimizer_result["market_context"],
                performance_benchmark=optimizer_result["performance_benchmark"],
                performance_outlook=optimizer_result["performance_outlook"],
                channel_strength=analyst_result["channel_strength"],
                channel_risk=analyst_result["channel_risk"],
            ),
            market=MarketSection(
                market_truth=analyst_result["market_truth"],
                dominant_force=analyst_result["dominant_force"],
                competitor_weakness=analyst_result["competitor_weakness"],
                audience_craving=analyst_result["audience_craving"],
                content_gaps=[
                    ContentGap(gap=g["gap"], source=g["source"])
                    for g in analyst_result.get("content_gaps", [])
                ],
                small_creator_verdict=analyst_result["small_creator_verdict"],
                small_creator_reason=analyst_result["small_creator_reason"],
                algorithm_signal=analyst_result["algorithm_signal"],
                satisfaction_risk=analyst_result["satisfaction_risk"],
                content_archetype=analyst_result["content_archetype"],
            ),
            creative=CreativeSection(
                suggested_title=strategist_result["suggested_title"],
                title_psychology=strategist_result["title_psychology"],
                title_alternatives=[
                    TitleVariant(title=t["title"], psychology_tag=t["psychology_tag"])
                    for t in strategist_result.get("title_alternatives", [])
                ],
                thumbnail_concept=strategist_result["thumbnail_concept"],
                thumbnail_contrast_rule=strategist_result["thumbnail_contrast_rule"],
                thumbnail_text_overlay=strategist_result.get("thumbnail_text_overlay", ""),
            ),
            execution=ExecutionSection(
                exact_hook_script=strategist_result["exact_hook_script"],
                hook_psychology=strategist_result["hook_psychology"],
                pacing_timeline=optimizer_result.get("pacing_timeline", []),
                retention_traps=[
                    RetentionTrap(
                        moment=r["moment"],
                        reason=r["reason"],
                        fix=r["fix"],
                    )
                    for r in optimizer_result.get("retention_traps", [])
                ],
                win_conditions=optimizer_result.get("win_conditions", []),
                fail_conditions=optimizer_result.get("fail_conditions", []),
                shorts_test_recommended=optimizer_result["shorts_test_recommended"],
                shorts_test_instruction=optimizer_result.get("shorts_test_instruction", ""),
            ),
            growth=GrowthSection(
                pinned_comment=optimizer_result["pinned_comment"],
                community_post_seed=optimizer_result["community_post_seed"],
                description_timestamps=optimizer_result["description_timestamps"],
                next_video_series=[
                    NextVideoIdea(
                        title=n["title"],
                        strategic_reason=n["strategic_reason"],
                        priority=n["priority"],
                    )
                    for n in optimizer_result.get("next_video_series", [])
                ],
                series_positioning=optimizer_result["series_positioning"],
            ),
        )

        print(
            f"[auto] pipeline complete — total time: {time.monotonic() - t_total:.1f}s"
        )
        return output

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {str(e)}") from e
