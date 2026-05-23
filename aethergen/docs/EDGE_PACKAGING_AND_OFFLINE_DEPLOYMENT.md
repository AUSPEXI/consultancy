# Edge Packaging and Offline Deployment – Implementation Log and Plan

## Purpose
Track current implementation, next steps, and enterprise offline roadmap (MoD/regulated).

## Implemented (MVP)
- Edge Bundle (Beta): generated via `Pipeline Manager → Edge Bundle (Beta)`
  - Manifest with device profile recommendation and available formats (GGUF/ONNX/LoRA)
  - Optional artifacts: harmonized schema, synthesis evidence
  - Guides: `guides/QUANTIZATION.txt`, `eval/RECIPES.txt`
- Device profiles: `public/device-profiles.json` (4–24+ GB tiers)
- Recommendation API: `/.netlify/functions/edge-recommend?vramGB=8&int8=true&fp16=true`
- Device detection heuristic in-browser (non-invasive)
- Exporters: GGUF, ONNX, LoRA (conversion pipeline integration points)
  
### New (Integrity & Safety)
- Integrity: `integrity/checksums.sha256.json` + `integrity/SIGNATURE.txt` placeholder
- SBOM: `sbom/sbom.json` listing bundle components
- Safety Policy Pack: `policy/policy.json` with blocked categories, red-team prompts, logging toggles

## Short-term (2–4 weeks)
- Exporters
  - GGUF: wire real conversion pipeline; add quant (Q4/Q5/Q8) selection and eval deltas
  - ONNX → TensorRT-LLM: conversion + engine build scripts per GPU arch
  - LoRA: produce real safetensors adapters; add per-customer licensing metadata
- Bundle contents
  - Add minimal eval datasets and prompts; safety red-team list
  - Add RAG index pack (embeddings + metadata) for offline retrieval
  - Add "Edge Deploy Guides" for Ollama, LM Studio, vLLM, NIM
- UI/DevEx
  - Auto-detect device, call `/edge-recommend`, prefill VRAM
  - One-click export with format selection and quantization level
  - Toggle to include signed checksums and organizational signature

## Enterprise offline (MoD/regulated)
- Isolation
  - Air-gapped bundle: no external calls; offline docs; checksums/signatures
  - Evidence bundles: cryptographic hashes; quantization impact included
- Governance & Compliance
  - Policy pack: default safety filters, logging toggles, and admin controls
  - License enforcement: adapter watermarking and per-tenant keys
  - Audit trails: offline append-only logs and periodic signed summaries
- Security
  - Supply-chain attestations: SBOM + signing for exporters and artifacts
  - Optional ZKP hooks for data handling attestations (future)
  - Offline signature verification and policy enforcement scripts
- Support
  - Device profile SLAs (Edge Starter/Pro), update cadence, and hotfix channel

## KPIs
- Time-to-first-inference (edge bundle)
- Eval deltas across quant levels
- Support MTTR for device issues
- Conversion from Edge Starter → Pro/cloud training

## Open Questions
- Preferred quantization defaults per industry vertical
- Required offline logging format for audits
- Customer-preferred local stacks (Ollama vs LM Studio vs NIM)

## Changelog
- v0.1.0-beta: Initial Edge Bundle, device profiles, recommendation API, exporters


