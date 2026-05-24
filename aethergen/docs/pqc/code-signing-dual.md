# Code Signing: Dual-Sign Rollout (ML-DSA + Current)

Scope: add ML-DSA (Dilithium) signatures alongside current scheme. Verify both; ship evidence.

## CI/CD Steps
1) Keys
- Generate ML-DSA keys (offline where possible). Store sealed in KMS/HSM if supported; else encrypted at rest.
- Keep current signing keys unchanged.

2) Signing stage
- Produce artifacts as usual.
- Sign with current scheme.
- Sign again with ML-DSA.
- Attach signatures and algorithm metadata to the release manifest.

3) Verification gate
- Verify both signatures in CI.
- Fail build if either path fails.

4) Evidence
- Emit posture JSON fragment: algorithm, signer, sizes, verify timings.
- Archive with release.

## Consumer
- Update verification tools in installers/agents to accept and check both signatures.
- Log algorithm used; warn (not fail) if ML-DSA unavailable during transition.

## Rollback
- Keep current scheme authoritative until adoption; remove ML-DSA step with a flag if needed.

## Notes
- Prefer SPHINCS+ as a diversity track for very high assurance components if size permits.
- Monitor signature size and verification time budgets.
