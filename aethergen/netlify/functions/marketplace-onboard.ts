import type { Handler } from '@netlify/functions'
import { ok, rateLimit, tooMany } from './_shared/supabase'

const handler: Handler = async (event) => {
  const rl = rateLimit(event, 'mp-onboard', 30, 60)
  if (!rl.allowed) return tooMany(rl.retryAfter)
  // Stub response with minimal instructions
  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body: `<html><body><h1>Marketplace Provider Onboarding (Preview)</h1>
<p>Feature-flagged. Email providers@aethergen.ai to request invite. Uploads require SBOM, license, checksums, and passing evaluation.</p>
<ul>
<li>Artifacts: ONNX/GGUF + manifest</li>
<li>Evidence: Harness results, privacy bounds, latency</li>
<li>Compliance: License, SBOM, checksums, terms</li>
</ul>
</body></html>`
  }
}

export { handler }


