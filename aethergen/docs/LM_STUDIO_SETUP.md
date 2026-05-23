### LM Studio Setup (Local LLM Provider)

Goal: run a local OpenAI‑compatible API for prompts/tools in AethergenAI.

Steps
1) Install LM Studio and download your model (e.g., gemma‑2‑2b‑it)
2) Start server: enable OpenAI‑compatible API; note host/port (e.g., http://localhost:1234)
3) In AethergenAI, set provider to local in settings (or via `providerConfig.ts`)
4) Context management: app uses `llmContextManager.ts` to keep prompts ≤ model’s window (e.g., 8k tokens)

Quick test
```bash
curl http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"local","messages":[{"role":"user","content":"hello"}]}'
```

Notes
- If your model supports only 8k tokens, the app will trim/summarize history accordingly.
- For Windows, ensure firewall allows LM Studio port.


