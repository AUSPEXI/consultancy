# PQC Targets (Standards-Only)

Decision: Adopt only NIST-selected families. No bespoke crypto. Hardening and evidence-focused rollout.

## Key Encapsulation / Key Exchange
- ML-KEM (Kyber) as primary KEM for transport (TLS, QUIC, gRPC) and app-to-app channels.
- Hybrid during transition: ML-KEM + X25519 (or P-256 where required) for defense-in-depth.

## Digital Signatures
- ML-DSA (Dilithium) as default.
- FALCON where signature size is critical and hardware/constant-time requirements are met.
- SPHINCS+ as diversity/backup track for high-assurance environments.

## PKI and Code Signing
- Issue PQ certificates (ML-DSA) with cross-sign until relying parties accept PQ roots.
- Code signing artifacts dual-signed (ML-DSA + current) until migration completes.

## Storage / At Rest
- Prioritize transport and identity first. Adopt PQ KEM-wrapped DEKs in KMS/HSM as vendor support lands.

## Interop Libraries
- Primary: liboqs (Open Quantum Safe) + OpenSSL provider.
- Runtime-specific bindings where needed; prefer battle-tested provider integrations.

## Performance Guardrails (Targets)
- Handshake success ≥ 99.9% across test matrix.
- p95 handshake latency increase ≤ 15% vs baseline.
- Payload growth within service SLO budgets (keys, certs, sigs).

## Evidence
- Ship signed posture metrics per release (see public/pqc/posture.sample.json).
- Capture configs, library versions, CPU features, and constant-time checks.

Status: Approved (standards only). Next: inventory and hybridization in top 3 transports.


