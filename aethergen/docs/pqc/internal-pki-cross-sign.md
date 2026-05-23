# Internal PKI Cross-Sign (ML-DSA leafs)

## Goal
Issue ML-DSA leaf certificates cross-signed by current CA, enable only on controlled mTLS clients.

## Steps
- Create ML-DSA CSR for service identities.
- Sign with ML-DSA intermediate; cross-sign with current intermediate to existing root.
- Publish chain bundle and algorithm metadata.

## Client rollout
- Update trust store to include ML-DSA intermediate.
- Enable negotiated group (hybrid KEM) separately in transport.
- Log cert algorithm per handshake; alert on failures.

## Monitoring
- Handshake success rate, p95 latency
- Failure reasons (chain building, unknown algorithm)
- Rollback switch to classical-only leafs

## Notes
- Keep public TLS classical for now; internal mTLS only.
- Track vendor support for ML-DSA in HSM/KMS before moving keys in-hardware.
