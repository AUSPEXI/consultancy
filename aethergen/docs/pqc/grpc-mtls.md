# gRPC mTLS with Hybrid KEM

## Server
- Link against OpenSSL 3.x with OQS provider
- Load oqsprovider at startup
- Set groups list: `x25519_mlkem768:x25519` (adjust level to policy)
- Log negotiated group per handshake

## Client
- Same provider setup as server
- Enforce groups list; fail open to classical only during canary

## Canary
1) Staging: PQ-only, classical-only, and hybrid clients must succeed
2) 1% prod canary: record success rate, p95 handshake, negotiated group share
3) Ramp: 1% → 25% → 100% with rollback switch

## Metrics
- SuccessRate, P95HandshakeMs, GroupShare{hybrid, classical}
- Errors by client class; retries

## Notes
- Keep signatures classical initially; migrate to ML-DSA via cross-sign separately
- Watch for middlebox/library skew
