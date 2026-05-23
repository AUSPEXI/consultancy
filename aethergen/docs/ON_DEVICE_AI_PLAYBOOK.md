On‑Device AI Playbook
=====================

Scope
-----
Design guidance for running Aethergen workloads on CPUs and NPUs with a hybrid fallback to cloud. Low‑cost to adopt; focuses on routing, SLOs, packaging, and telemetry.

Routing strategy
----------------
- Default to CPU backend (bitnet.cpp or ONNX Runtime Mobile) for gates, re‑rankers, and narrow extractors.
- Promote cloud only when a request exceeds thresholds or a capability is unsupported.
- Explicit modes: on‑device only, hybrid, cloud only.

SLOs (extend existing)
----------------------
- Utility: accuracy and error bounds vs cloud baseline.
- Latency: p50, p95 thresholds per device class.
- Fallback rate: max percent of requests routed to cloud.
- Battery budget: max mWh per inference; disable or reduce coverage when battery < X%.
- Thermal guard: max temperature delta; reduce coverage or defer.

Packaging and updates
---------------------
- Artifacts: small specialist models, PEFT adapters, tokenizer assets, calibration json.
- Runtimes: ONNX Runtime Mobile where available; bitnet.cpp as CPU fallback.
- Updates: staged rollout, delta packages, rollbacks gated by evidence.

NPU heterogeneity
-----------------
- Capability map per vendor: ops, precision, kernels.
- Fallback chain: NPU → GPU → CPU.
- Telemetry for unsupported ops to guide builds.

Privacy and data minimization
-----------------------------
- Keep residuals local; sync DP summaries only.
- Sign and publish evidence bundles with device class tags.

Telemetry
---------
Log per request (local, sampled): TTFT, tokens/sec (if relevant), p50/p95 latency, energy estimate, temperature delta, fallback reason, accuracy delta vs cloud.

Activation
----------
- Flags: `ONDEVICE_ENABLED`, `ONDEVICE_HYBRID`, device‑class overrides.
- UI: show mode, battery/thermal state, and fallback rate.



