# YtAdvisor AI Engine – Developer Guide

> **Target audience**: Developers joining or maintaining the Python AI pipeline.  
> **Scope**: Full codebase walkthrough, architecture, data flow, and how to extend safely.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Data Flow & Request Lifecycle](#data-flow--request-lifecycle)
3. [Core Models & Schemas](#core-models--schemas)
4. [File-by-File Responsibilities](#file-by-file-responsibilities)
5. [Agent Implementation Details](#agent-implementation-details)
6. [LLM Service & Timeout Strategy](#llm-service--timeout-strategy)
7. [Error Handling & Fallbacks](#error-handling--fallbacks)
8. [Extending the Pipeline](#extending-the-pipeline)
9. [Testing & Debugging](#testing--debugging)
10. [Deployment & Ops](#deployment--ops)

---

## High-Level Architecture

```
┌─────────────┐
│ FastAPI     │
│ /api/v1/analyze
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ 1️⃣ Analyst Agent            │
│ - Market reality             │
│ - Content gaps               │
│ - Archetype classification   │
└──────┬──────────────────────┘
       │ (analyst_output dict)
       ▼
┌─────────────────────────────┐
│ 2️⃣ Strategist Agent         │
│ - Hook script                │
│ - Thumbnail contrast         │
│ - Title psychology           │
└──────┬──────────────────────┘
       │ (strategist_output dict)
       ▼
┌─────────────────────────────┐
│ 3️⃣ Optimizer Agent          │
│ - Pacing guide               │
│ - Quality upgrades           │
│ - Post-publish strategy      │
│ - Final verdict             │
└──────┬──────────────────────┘
       │
       ▼
┌───────────────────────┐
│ Combined JSON Response│
│ status: success       │
│ data: {analyst, strategist, optimizer}
└───────────────────────┘
```

- **No external API calls** (YouTube, Gemini) are made in the main endpoint.
- All agents use a **shared timeout wrapper** (`generate_content_with_timeout`) to prevent hangs.
- Each agent returns **plain dicts** via `.model_dump()`, not Pydantic objects, to keep FastAPI response serialization simple.

---

## Data Flow & Request Lifecycle

1. **Ingress**: FastAPI receives `AgentContext` (Pydantic model) at `/api/v1/analyze`.
2. **Sequential execution**:
   - `run_analyst_agent(context)` → `analyst_result: dict`
   - `run_strategist_agent(context, analyst_result)` → `strategist_result: dict`
   - `run_optimizer_agent(context, analyst_result, strategist_result)` → `optimizer_result: dict`
3. **Response**: All three dicts are wrapped under `{"status": "success", "data": {...}}`.
4. **Error path**: Any exception bubbles up → `HTTPException(500, detail=str(e))`.

---

## Core Models & Schemas

### `api_models.py`

All shared contracts live here. **Do not add AI logic** to this file.

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `AgentContext` | Input to the pipeline | `request: InitialRequest`, `signals: YouTubeSignals`, `competitors: CompetitorData` |
| `InitialRequest` | User’s video idea | `video_idea: str`, `creator_dna: Optional[str]` |
| `YouTubeSignals` | Market metrics | `search_volume: int`, `keyword_saturation: High|Medium|Low`, `top_video_velocity: int` |
| `CompetitorData` | Competitor context | `thumbnails: List[str]`, `top_comments: str` |
| `ArchetypeEnum` | Content type | `CORE_AUDIENCE`, `VIRAL_REACH`, `SEARCH_EVERGREEN` |
| `VerdictEnum` | Final decision | `GO`, `MODIFY`, `AVOID` |

### Per-Agent Output Models

Each agent defines its own Pydantic output model in its own file:

- `AnalystAgentOutput` (`analyst_agent.py`)
- `StrategistAgentOutput` (`strategist_agent.py`)
- `OptimizerAgentOutput` (`optimizer_agent.py`)

These are **not** shared across agents to keep schemas tight and avoid cross-dependencies.

---

## File-by-File Responsibilities

| File | Role | Key Functions/Classes |
|------|------|------------------------|
| `main.py` | FastAPI entry point and orchestration | `app`, `analyze(payload: AgentContext)` |
| `api_models.py` | Shared contracts and enums | `AgentContext`, `ArchetypeEnum`, `VerdictEnum`, etc. |
| `llm_service.py` | Gemini client and timeout wrapper | `generate_content_with_timeout`, `_parse` |
| `analyst_agent.py` | Market analysis agent | `run_analyst_agent(context)`, `AnalystAgentOutput` |
| `strategist_agent.py` | Creative packaging agent | `run_strategist_agent(context, analyst_output)`, `StrategistAgentOutput` |
| `optimizer_agent.py` | Execution and verdict agent | `run_optimizer_agent(context, analyst_output, strategist_output)`, `OptimizerAgentOutput` |
| `models.py` | Legacy/unused models (kept for compatibility) | **Do not use in new code** |
| `youtube_service.py` | YouTube API helpers (optional) | Used only if you enrich `AgentContext` externally |
| `data_feature_extractor.py` | Feature extraction from raw video data | Used only if you pre-process YouTube data externally |
| `creator_profile_service.py` | Creator profile building | Used only if you pre-build profiles externally |

---

## Agent Implementation Details

### Common Pattern

All agents follow the same structure:

```python
def run_<name>_agent(context: AgentContext, ...) -> dict:
    print("[<name>] starting...")
    t0 = time.monotonic()

    system_prompt = "...exact prompt text..."
    user_prompt = "...formatted from context..."

    model = genai.GenerativeModel(llm_service._MODEL_NAME, system_instruction=system_prompt)

    try:
        response = llm_service.generate_content_with_timeout(
            model,
            user_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
                response_schema=<AgentOutputModel>,
            ),
            timeout_s=90,
        )
    except Exception:
        # safe fallback
        result = <AgentOutputModel>(...).model_dump()
        # log and return
        return result

    raw_text = response.text or ""

    try:
        parsed = llm_service._parse(raw_text, <AgentOutputModel>)
        result = parsed.model_dump()
    except Exception:
        # fallback: try to extract JSON manually
        try:
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            obj = json.loads(raw_text[start : end + 1])
            result = <AgentOutputModel>.model_validate(obj).model_dump()
        except Exception:
            result = <AgentOutputModel>(...).model_dump()

    print({"stage": "<name>", "output": result})
    print(f"[{name}] done in {time.monotonic() - t0:.1f}s")
    return result
```

### Analyst Agent

- **Goal**: Evaluate market reality, identify gaps, classify archetype.
- **Key prompt rules**:
  - `content_gaps` must be derived *strictly* from competitor comments.
  - `satisfaction_risk` is 1–10 measuring title-to-execution gap.
- **Outputs**: `market_truth`, `dominant_force`, `content_gaps`, `satisfaction_risk`, `channel_leverage`, `content_archetype`.

### Strategist Agent

- **Goal**: Produce hook script, thumbnail contrast, and title psychology.
- **Key prompt rules**:
  - `exact_hook_script` is word-for-word 5-second hook.
  - `thumbnail_contrast_prompt` must look completely different from provided thumbnails.
  - Tone based on `content_archetype` from analyst.
- **Outputs**: `exact_hook_script`, `thumbnail_contrast_prompt`, `title_psychology`.

### Optimizer Agent

- **Goal**: Execution guide, quality upgrades, post-publish plan, and final verdict.
- **Key prompt rules**:
  - `performance_outlook` must follow format: `[Expected Baseline] | [Viral Ceiling] | [Quality Focus]`.
  - If `satisfaction_risk` high or `keyword_saturation` High, set `shorts_test_recommended` to `True`.
  - `final_verdict` must be one of `GO`, `MODIFY`, `AVOID`.
- **Outputs**: `pacing_guide`, `quality_upgrades`, `post_publish_strategy`, `shorts_test_recommended`, `performance_outlook`, `final_verdict`.

---

## LLM Service & Timeout Strategy

### `generate_content_with_timeout`

- Wraps `model.generate_content` in a `ThreadPoolExecutor` with a timeout.
- Prevents indefinite hangs from Gemini API.
- Returns `response` on success; raises `Exception` on timeout/failure.

### `_parse`

- Uses Gemini’s built-in structured parsing (`response_schema`).
- Falls back to manual JSON extraction if parsing fails.
- Returns a Pydantic model instance.

### Why 90s timeout?

- Empirically safe for moderately complex prompts.
- FastAPI endpoint runs in a thread pool; a single slow call won’t block the event loop.

---

## Error Handling & Fallbacks

- **Network/timeout**: Agent returns safe defaults (empty strings, `MODIFY`, etc.).
- **Parse failure**: Same fallback as timeout.
- **Catastrophic exception**: FastAPI raises `HTTPException(500, detail=str(e))`.
- **No silent failures**: All paths return a valid response or raise a clear 500.

---

## Extending the Pipeline

### Adding a New Agent

1. Create `new_agent.py` with:
   - `NewAgentOutput(BaseModel)` defining fields.
   - `run_new_agent(context: AgentContext, ...) -> dict` following the common pattern.
2. Import and call it in `main.py` after the optimizer.
3. Add its result to the combined response dict.

### Enriching `AgentContext`

If you want to add live YouTube data:

```python
from youtube_service import get_competitor_data, detect_monopoly, detect_personality_driven, detect_fragmented
from data_feature_extractor import extract_features

videos = get_competitor_data(queries, youtube_api_key)
features = extract_features(videos)

# Map features into AgentContext
context = AgentContext(
    request=InitialRequest(video_idea=idea),
    signals=YouTubeSignals(
        search_volume=features.get("search_volume", 0),
        keyword_saturation=features.get("keyword_saturation", "Medium"),
        top_video_velocity=features.get("top_video_velocity", 0),
    ),
    competitors=CompetitorData(
        thumbnails=[v.thumbnail for v in videos],
        top_comments=features.get("top_comments", ""),
    ),
)
```

### Updating Prompts

- Edit the `system_prompt` and `user_prompt` strings inside the agent file.
- Keep the **exact prompt rules** required by each agent (see Agent Implementation Details).

---

## Testing & Debugging

### Unit Tests (not yet implemented)

You can add tests under `tests/`:

```python
def test_anystep():
    ctx = AgentContext(...)
    result = run_analyst_agent(ctx)
    assert "market_truth" in result
```

### Smoke Test

Run the compile check:

```bash
cd python
python _check.py
```

### Manual Test

```bash
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"request":{"video_idea":"Test idea"},"signals":{"search_volume":1000,"keyword_saturation":"Low","top_video_velocity":2000},"competitors":{"thumbnails":[],"top_comments":""}}'
```

### Debug Logs

Each agent prints:
- `[agent] starting...`
- Timing logs at the end
- Structured logs with `{"stage": "...", "output": ...}`

---

## Deployment & Ops

### Environment Variables

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `GEMINI_API_KEY` | Yes | Gemini LLM access |
| `YOUTUBE_API_KEY` | Optional | If you enrich with live YouTube data |

### Running in Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

- Use `--workers` to enable concurrency.
- Ensure `GEMINI_API_KEY` is set in the environment (not hardcoded).

### Monitoring

- Each agent logs its timing. Use these to detect slow LLM calls.
- All errors raise `HTTPException(500)` with a readable `detail`.

---

## Gotchas & Common Pitfalls

- **Do not import `models.py`** in new code. It’s legacy.
- **Do not add AI logic to `api_models.py`**.
- **Always use `.model_dump()`** to return dicts from agents, not Pydantic objects.
- **Never change agent function signatures** without updating `main.py`.
- **Timeouts are per-agent**; the total request time can be up to ~3× timeout in worst case.

---

## Summary for New Devs

1. **Read `api_models.py`** to understand the input contract.
2. **Pick an agent file** to see how prompts and parsing work.
3. **Run `_check.py`** to verify imports.
4. **Start the server** with `uvicorn main:app --port 8000`.
5. **Send a POST** to `/api/v1/analyze` to see the full pipeline in action.

That’s it. Welcome to the YtAdvisor AI engine! 🚀
