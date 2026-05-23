# PQC Inventory (Checklist)

Purpose: enumerate where keys, signatures, and key exchanges are used so we can phase in NIST PQC with minimal risk.

## Transports (KEM / Key Exchange)
- [ ] Public web (TLS terminators / CDN)
- [ ] Service-to-service (mTLS, gRPC, QUIC)
- [ ] Admin/ops endpoints (SSH variants, VPN)
- [ ] Mobile/edge up-links
- [ ] Third-party integrations

For each transport:
- Endpoint(s):
- Current KEX/cipher:
- Libraries/versions:
- Traffic volume (p50/p95 RPS):
- Latency SLO (p95):
- Proposed: Hybrid ML-KEM + X25519 (yes/no):

## Identities (Signatures)
- [ ] PKI (leaf/intermediate/root)
- [ ] Code signing (packages, images, firmware)
- [ ] Artifact attestation (SBOM, provenance)

For each identity:
- Issuer/chain:
- Current algorithm:
- Verification surfaces (CI/CD, clients):
- Proposed: ML-DSA, FALCON (where size-critical), SPHINCS+ (diversity):
- Cross-sign window (start/end):

## Storage / KMS / HSM
- [ ] DEK wrapping / envelope encryption
- [ ] Secrets at rest (DB, object storage)
- [ ] Backup/restore channels

For each:
- Provider (KMS/HSM/lib):
- Current wrap algorithm:
- PQC support available? (Y/N)
- Plan: adopt PQ KEM-wrapped DEKs when supported; track vendor roadmap

## Device Classes
- [ ] Server (x86_64/AVX2/AVX512)
- [ ] Server (ARM)
- [ ] Mobile (iOS/Android tiers)
- [ ] Edge (single-board, embedded)

Perf SLOs per class:
- Max handshake p95 delta vs baseline: 15%
- Min success rate: 99.9%

## Evidence Artifacts
- [ ] Posture JSON per release (see public/pqc/posture.sample.json)
- [ ] Constant-time checks (tool + result)
- [ ] Bench matrix results (handshake, sizes)

Owner: ______   Review date: ______
