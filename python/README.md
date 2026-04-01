# YtAdvisor AI Engine – Python FastAPI Service

## Overview

This is a clean, modular FastAPI service that runs three AI agents sequentially to analyze a YouTube video idea:

1. **Analyst Agent** – evaluates market reality and gaps
2. **Strategist Agent** – provides hook script, thumbnail contrast, and title psychology
3. **Optimizer Agent** – gives pacing, quality upgrades, post-publish plan, and final verdict

All agents share a single input schema (`AgentContext`) and return structured JSON via Pydantic models.

---

## Quick Start

### 1. Install dependencies

```bash
cd python
pip install -r requirements.txt  # ensure you have FastAPI, uvicorn, pydantic, google-generativeai
```

### 2. Set environment variables

```bash
export GEMINI_API_KEY="your_gemini_key"
# Optional: YOUTUBE_API_KEY if you extend to fetch live data
```

### 3. Run the server

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The service will be available at `http://localhost:8000`.

---

## API Contract

### POST `/api/v1/analyze`

Accepts a JSON payload matching `AgentContext` and returns a combined response for all three agents.

#### Request Schema (`AgentContext`)

```json
{
  "request": {
    "video_idea": "string",
    "creator_dna": "string (optional)"
  },
  "signals": {
    "search_volume": "int",
    "keyword_saturation": "High|Medium|Low",
    "top_video_velocity": "int"
  },
  "competitors": {
    "thumbnails": ["url1", "url2"],
    "top_comments": "string"
  }
}
```

#### Response Schema

```json
{
  "status": "success",
  "data": {
    "analyst": { /* AnalystAgentOutput */ },
    "strategist": { /* StrategistAgentOutput */ },
    "optimizer": { /* OptimizerAgentOutput */ }
  }
}
```

---

## Agent Details

### 1. Analyst Agent (`run_analyst_agent`)

**Input**: `AgentContext`  
**Output**: `AnalystAgentOutput`

Fields:
- `market_truth`: short market summary
- `dominant_force`: who controls the niche
- `content_gaps`: derived strictly from competitor comments
- `satisfaction_risk`: int 1–10 measuring title-to-execution gap
- `channel_leverage`: how a channel can stand out
- `content_archetype`: `CORE_AUDIENCE | VIRAL_REACH | SEARCH_EVERGREEN`

### 2. Strategist Agent (`run_strategist_agent`)

**Input**: `AgentContext` + `analyst_output`  
**Output**: `StrategistAgentOutput`

Fields:
- `exact_hook_script`: word-for-word 5-second hook
- `thumbnail_contrast_prompt`: how to make a thumbnail that looks completely different from competitors
- `title_psychology`: reasoning behind the title’s emotional pull

### 3. Optimizer Agent (`run_optimizer_agent`)

**Input**: `AgentContext` + `analyst_output` + `strategist_output`  
**Output**: `OptimizerAgentOutput`

Fields:
- `pacing_guide`: rhythm and structure recommendations
- `quality_upgrades`: tactical improvements
- `post_publish_strategy`: what to do after upload
- `shorts_test_recommended`: boolean (forced true if satisfaction_risk high or keyword_saturation High)
- `performance_outlook`: string format `"[Expected Baseline] | [Viral Ceiling] | [Quality Focus]"`
- `final_verdict`: `GO | MODIFY | AVOID`

---

## Important Implementation Details

- Each agent uses `llm_service.generate_content_with_timeout` with a 90s timeout.
- All agents fall back to safe defaults on timeout or parse failure.
- Responses are returned as plain dicts via `.model_dump()`.
- Errors raise `HTTPException(500, detail=…)`.

---

## Testing the Endpoint

You can `curl` the service:

```bash
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "request": {"video_idea": "How to study efficiently for exams"},
    "signals": {"search_volume": 12000, "keyword_saturation": "Medium", "top_video_velocity": 45000},
    "competitors": {"thumbnails": ["https://img.com/a.png","https://img.com/b.png"], "top_comments": "Students love concise summaries."}
  }'
```

Or use Python/requests:

```python
import requests

r = requests.post("http://localhost:8000/api/v1/analyze", json={
    "request": {"video_idea": "How to study efficiently for exams"},
    "signals": {"search_volume": 12000, "keyword_saturation": "Medium", "top_video_velocity": 45000},
    "competitors": {"thumbnails": ["https://img.com/a.png","https://img.com/b.png"], "top_comments": "Students love concise summaries."}
})

print(r.json())
```

---

## Files

- `main.py` – FastAPI app and endpoint router
- `api_models.py` – shared Pydantic models and enums
- `analyst_agent.py` – market analysis agent
- `strategist_agent.py` – packaging/creative agent
- `optimizer_agent.py` – execution/verdict agent
- `llm_service.py` – Gemini LLM client and timeout wrapper

---

## Troubleshooting

- **Import errors**: Ensure you’re in the `python` folder when running, or adjust `PYTHONPATH`.
- **Gemini API failures**: Verify `GEMINI_API_KEY` is set and valid.
- **Timeouts**: Check network connectivity; agents have 90s timeout each.
- **Parse failures**: LLM may return malformed JSON; agents fall back safely, and the service still returns 200.

---

## Extending

If you want to enrich `AgentContext` with live YouTube data:
- Use `youtube_service.py` helpers to fetch competitors, transcripts, and anomaly signals.
- Map that data into `AgentContext.signals` and `AgentContext.competitors` before calling the endpoint.

---

**That’s it!**  
Run the server, send a POST to `/api/v1/analyze`, and get structured analyst/strategist/optimizer insights in one clean response.
