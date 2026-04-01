from enum import Enum
from typing import List, Optional, Literal
from pydantic import BaseModel


class ArchetypeEnum(str, Enum):
    CORE_AUDIENCE = "CORE_AUDIENCE"
    VIRAL_REACH = "VIRAL_REACH"
    SEARCH_EVERGREEN = "SEARCH_EVERGREEN"

class VerdictEnum(str, Enum):
    GO = "GO"
    MODIFY = "MODIFY"
    ABORT = "ABORT"

class ConfidenceEnum(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class SmallCreatorVerdictEnum(str, Enum):
    CAN_WIN = "CAN_WIN"
    HARD = "HARD"
    AVOID = "AVOID"


class CompetitorData(BaseModel):
    thumbnails: List[str]
    top_comments: str

class InitialRequest(BaseModel):
    video_idea: str
    creator_dna: Optional[str] = None

class AgentContext(BaseModel):
    request: InitialRequest
    competitors: CompetitorData


class ContentGap(BaseModel):
    gap: str
    source: str

class TitleVariant(BaseModel):
    title: str
    psychology_tag: str

class RetentionTrap(BaseModel):
    moment: str
    reason: str
    fix: str

class NextVideoIdea(BaseModel):
    title: str
    strategic_reason: str
    priority: int


class VerdictSection(BaseModel):
    final_verdict: VerdictEnum
    confidence: ConfidenceEnum
    confidence_reason: str
    idea_upgrade: str
    market_context: str
    performance_benchmark: str
    performance_outlook: str
    channel_strength: str
    channel_risk: str

class MarketSection(BaseModel):
    market_truth: str
    dominant_force: str
    competitor_weakness: str
    audience_craving: str
    content_gaps: List[ContentGap]
    small_creator_verdict: SmallCreatorVerdictEnum
    small_creator_reason: str
    algorithm_signal: str
    satisfaction_risk: int
    content_archetype: ArchetypeEnum

class CreativeSection(BaseModel):
    suggested_title: str
    title_psychology: str
    title_alternatives: List[TitleVariant]
    thumbnail_concept: str
    thumbnail_contrast_rule: str
    thumbnail_text_overlay: str

class ExecutionSection(BaseModel):
    exact_hook_script: str
    hook_psychology: str
    pacing_timeline: List[str]
    retention_traps: List[RetentionTrap]
    win_conditions: List[str]
    fail_conditions: List[str]
    shorts_test_recommended: bool
    shorts_test_instruction: str

class GrowthSection(BaseModel):
    pinned_comment: str
    community_post_seed: str
    description_timestamps: str
    next_video_series: List[NextVideoIdea]
    series_positioning: str

class DimenziqAnalysisOutput(BaseModel):
    verdict: VerdictSection
    market: MarketSection
    creative: CreativeSection
    execution: ExecutionSection
    growth: GrowthSection
