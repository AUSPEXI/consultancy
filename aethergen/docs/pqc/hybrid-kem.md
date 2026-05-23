# Hybrid KEM Integration (ML-KEM + X25519)

Scope: introduce post-quantum key exchange alongside a classical KEX for defense-in-depth during transition.

## Libraries
- OpenSSL 3.x with OQS provider (liboqs)
- Prefer distro packages when available; else vendor from source with CI cache

## TLS server (reverse proxy / CDN / ingress)
- Enable provider:
  - Configure OpenSSL to load the oqsprovider at startup
  - Verify available TLS groups include `x25519_mlkem768` (or chosen ML-KEM level)
- Cipher groups (examples):
  - `TLS_GROUPS="x25519_mlkem768:x25519:secp256r1"`
- Certificates: continue current chain; signatures migrate separately
- Health tests:
  - PQ-only client → success
  - Classical-only client → success
  - Hybrid client → success; record negotiated group

## gRPC / mTLS
- Client/server OpenSSL engines load oqsprovider
- Set `SSL_CTX_set1_groups_list(ctx, "x25519_mlkem768:x25519")`
- Verify mutual auth plus negotiated group logging

## QUIC
- Use a QUIC stack linked against OpenSSL+oqsprovider
- Exercise handshake trace; capture RTT/bytes deltas

## Rollout plan
1) Dark launch in staging, mirror traffic via shadow tests
2) Canary 1% region, monitor posture metrics (success, p95, group share)
3) Ramp to 25% → 100% with rollback switch

## Metrics to ship (tie to posture JSON)
- Success rate by client class and negotiated group
- p95 handshake latency vs baseline
- Payload size deltas (ClientHello, cert chain)

## Known pitfalls
- Middleboxes that reject unknown groups
- Library version skew (provider vs OpenSSL)
- Mis-reported success if clients silently fall back
