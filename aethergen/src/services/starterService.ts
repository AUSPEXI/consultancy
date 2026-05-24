import JSZip from 'jszip'

export type StarterType = 'llm'|'slm'|'lam'|'moe'|'vlm'|'mlm'|'lcm'|'sam'

function nowISO() { return new Date().toISOString() }

export async function generateStarterZip(type: StarterType): Promise<Blob> {
  const zip = new JSZip()
  const meta = { type, created_at: nowISO(), version: '0.1' }
  zip.file('starter.json', JSON.stringify(meta, null, 2))

  // Common files
  zip.folder('evidence')?.file('README.md', '# Evidence\nThis starter includes hooks to export signed evidence later.')
  zip.folder('configs')?.file('slos.yaml', defaultSLOs(type))
  zip.folder('context')?.file('context_policy.md', '* Use Context Engine signals to decide fetch/clarify/abstain.')

  switch (type) {
    case 'llm':
    case 'slm':
      zip.file('README.md', readme('Text model with Context Engine + Risk Guard'))
      zip.folder('src')?.file('app.ts', llmStub(type==='slm'))
      break
    case 'lam':
      zip.file('README.md', readme('Agent plan/act with typed tools'))
      zip.folder('src')?.file('agent.ts', lamStub())
      break
    case 'moe':
      zip.file('README.md', readme('Mixture-of-Experts router'))
      zip.folder('src')?.file('router.ts', moeStub())
      break
    case 'vlm':
      zip.file('README.md', readme('Vision-Language prompts and citations'))
      zip.folder('src')?.file('vlm.ts', vlmStub())
      break
    case 'mlm':
      zip.file('README.md', readme('Embeddings + retrieval with eval harness'))
      zip.folder('src')?.file('retrieval.ts', mlmStub())
      break
    case 'lcm':
      zip.file('README.md', readme('Fast image generation placeholder with guards'))
      zip.folder('src')?.file('lcm.ts', lcmStub())
      break
    case 'sam':
      zip.file('README.md', readme('Segmentation with mask export and IoU evidence'))
      zip.folder('src')?.file('sam.ts', samStub())
      break
  }

  return zip.generateAsync({ type: 'blob' })
}

function readme(title: string) {
  return `# ${title}\n\nThis starter ships with default SLOs and placeholders. Integrate your model and wire Risk Guard/Context Engine as needed.`
}

function defaultSLOs(type: StarterType) {
  const onDevice = type==='slm'
  return [
    'utility_at_op_min: 0.75',
    'latency_p95_ms: 200',
    onDevice ? 'ondevice: { enabled: true, max_fallback_rate: 0.15, max_battery_mwh: 2.5, max_temp_delta_c: 6 }' : ''
  ].filter(Boolean).join('\n')
}

function llmStub(onDevice: boolean) {
  return `export async function runLLM(input: string) {\n  // TODO: call model (onDevice=${onDevice}) and use packed context\n  return { text: 'hello', citations: [] }\n}`
}
function lamStub() {
  return `export async function agent(task: string, tools: Record<string,(args:any)=>Promise<any>>) {\n  // plan -> act -> observe loop (placeholder)\n  return { done: true }\n}`
}
function moeStub() {
  return `export function route(input: any, scores: number[]) {\n  // pick expert by score/threshold\n  return scores.indexOf(Math.max(...scores))\n}`
}
function vlmStub() {
  return `export async function vlm(image: Blob, question: string) {\n  // encode image+text and return answer with spans\n  return { answer: '', spans: [] }\n}`
}
function mlmStub() {
  return `export async function buildIndex(rows: any[]){}\nexport async function query(q: string){ return { docs: [] } }\n`
}
function lcmStub() {
  return `export async function generate(prompt: string){ return new Blob() }\n`
}
function samStub() {
  return `export async function segment(image: Blob){ return { masks: [] } }\n`
}



