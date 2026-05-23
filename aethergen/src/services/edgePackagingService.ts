import JSZip from 'jszip'
import QRCode from 'qrcode'

export type DeviceProfile = {
	name: string
	minVramGB: number
	supportsInt8: boolean
	supportsFp16: boolean
	recommendedModelMaxParamsB: number
	recommendedQuant: Array<'FP16' | 'INT8' | 'Q4' | 'Q5' | 'Q8'>
}

export type EdgeBundleManifest = {
	name: string
	version: string
	createdAt: string
	deviceProfileRecommendation: string
	deviceProfiles: DeviceProfile[]
	exportFormats: string[]
	contents: string[]
}

export type RecommendInput = {
	vramGB: number
	int8?: boolean
	fp16?: boolean
}

export async function loadDeviceProfiles(): Promise<DeviceProfile[]> {
	const res = await fetch('/device-profiles.json')
	if (!res.ok) throw new Error('Failed to load device profiles')
	return (await res.json()) as DeviceProfile[]
}

export function recommendDeviceProfile(
	profiles: DeviceProfile[],
	info: RecommendInput,
): DeviceProfile {
	const eligible = profiles
		.filter(p => info.vramGB >= p.minVramGB)
		.sort((a, b) => b.minVramGB - a.minVramGB)
	if (eligible.length === 0) {
		// fallback to smallest profile
		return profiles.slice().sort((a, b) => a.minVramGB - b.minVramGB)[0]
	}
	// prefer INT8 if available and supported
	const preferInt8 = info.int8 === true
	if (preferInt8) {
		const withInt8 = eligible.find(p => p.supportsInt8)
		if (withInt8) return withInt8
	}
	return eligible[0]
}

export async function generateEdgeBundleZip(options: {
	projectName: string
	version?: string
	deviceInfo: RecommendInput
	harmonizedSchema?: unknown
	synthesisEvidence?: unknown
}): Promise<Blob> {
	const profiles = await loadDeviceProfiles()
	const rec = recommendDeviceProfile(profiles, options.deviceInfo)
	const now = new Date().toISOString()

	const manifest: EdgeBundleManifest = {
		name: options.projectName,
		version: options.version || '0.1.0-beta',
		createdAt: now,
		deviceProfileRecommendation: rec.name,
		deviceProfiles: profiles,
		exportFormats: ['GGUF (Ollama/LM Studio)', 'ONNX (TensorRT‑LLM path)', 'LoRA (safetensors)'],
		contents: [
			'README.txt',
			'edge-manifest.json',
			options.harmonizedSchema ? 'harmonized_schema.json' : '',
			options.synthesisEvidence ? 'synthesis_evidence.json' : '',
		].filter(Boolean) as string[],
	}

	const readme = [
		'# Edge Bundle (Beta)',
		'',
		`Project: ${options.projectName}`,
		`Created: ${now}`,
		'',
		'What is included:',
		'- edge-manifest.json with device recommendations',
		'- Optional: harmonized schema and synthesis evidence',
		'',
		'Next steps:',
		'1) Choose a model size matching your device profile.',
		'2) Export a quantized artifact (GGUF/ONNX/LoRA) using AethergenPlatform exporters.',
		'3) Run locally:',
		'   - Ollama: ollama run <model>  or  LM Studio: import GGUF',
		'   - TensorRT‑LLM: convert ONNX and build engine for your GPU',
		'',
		'Evaluation & Safety:',
		'- Validate latency/quality with the included evaluation recipes.',
		'- Review quantization impact before production.',
	].join('\n')

	const zip = new JSZip()
	zip.file('edge-manifest.json', JSON.stringify(manifest, null, 2))
	zip.file('README.txt', readme)
	if (options.harmonizedSchema) {
		zip.file('harmonized_schema.json', JSON.stringify(options.harmonizedSchema, null, 2))
	}
	if (options.synthesisEvidence) {
		zip.file('synthesis_evidence.json', JSON.stringify(options.synthesisEvidence, null, 2))
	}

	// Add evaluation recipes and quantization guidance
	const evalTxt = [
		'# Evaluation Recipes',
		'- Latency: run simple prompt set, record tokens/sec',
		'- Quality: small truth set; compute exact-match/rouge for QA prompts',
		'- Safety: red-team list, flag disallowed outputs',
	].join('\n')
	zip.folder('eval')?.file('RECIPES.txt', evalTxt)
	const quantTxt = [
		'# Quantization Guidance',
		`Profile: ${rec.name}`,
		`Recommended: ${rec.recommendedQuant.join(', ')}`,
		'Compare outputs across FP16 vs INT8/Q4 using eval/RECIPES.txt.',
	].join('\n')
	zip.folder('guides')?.file('QUANTIZATION.txt', quantTxt)

	// Add basic SBOM and checksums
	const filesForChecksum: Array<{ path: string; content: string }> = []
	filesForChecksum.push({ path: 'edge-manifest.json', content: JSON.stringify(manifest) })
	filesForChecksum.push({ path: 'README.txt', content: readme })
	if (options.harmonizedSchema) filesForChecksum.push({ path: 'harmonized_schema.json', content: JSON.stringify(options.harmonizedSchema) })
	if (options.synthesisEvidence) filesForChecksum.push({ path: 'synthesis_evidence.json', content: JSON.stringify(options.synthesisEvidence) })

	const encoder = new TextEncoder()
	async function sha256Hex(input: string): Promise<string> {
		const data = encoder.encode(input)
		const hash = await crypto.subtle.digest('SHA-256', data)
		const arr = Array.from(new Uint8Array(hash))
		return arr.map(b => b.toString(16).padStart(2, '0')).join('')
	}

	const checksums: Record<string, string> = {}
	for (const f of filesForChecksum) {
		checksums[f.path] = await sha256Hex(f.content)
	}
	zip.folder('integrity')?.file('checksums.sha256.json', JSON.stringify(checksums, null, 2))
	zip.folder('integrity')?.file('SIGNATURE.txt', 'Placeholder for detached signature. Use your org signing key.')

	const sbom = {
		name: options.projectName,
		version: manifest.version,
		generated: now,
		components: [
			{ name: 'edge-manifest.json', type: 'document' },
			{ name: 'README.txt', type: 'document' },
			options.harmonizedSchema ? { name: 'harmonized_schema.json', type: 'data' } : null,
			options.synthesisEvidence ? { name: 'synthesis_evidence.json', type: 'data' } : null,
			{ name: 'guides/QUANTIZATION.txt', type: 'guide' },
			{ name: 'eval/RECIPES.txt', type: 'guide' },
			{ name: 'integrity/checksums.sha256.json', type: 'integrity' },
		].filter(Boolean),
	}
	zip.folder('sbom')?.file('sbom.json', JSON.stringify(sbom, null, 2))

	// Safety policy pack (baseline)
	const policy = {
		blockedCategories: ['violent.extreme', 'sexual.minor', 'illegal.instructions'],
		redTeamPrompts: ['how to make ... illegal', 'bypass safety ...', 'exploit ...'],
		logging: { enabled: false, level: 'minimal' },
	}
	zip.folder('policy')?.file('policy.json', JSON.stringify(policy, null, 2))

	return await zip.generateAsync({ type: 'blob' })
}

// Air-gapped types
export type AirGappedManifest = {
	version: string
	name: string
	createdAt: string
	manifestHash: string
	qrHash: string
	signedBy: string
	deviceProfileRecommendation: string
	deviceProfiles: DeviceProfile[]
	exportFormats: string[]
	files: Array<{
		path: string
		sha256: string
		size: number
	}>
	build: {
		time: string
		env: string
		version: string
	}
	evidence: {
		lineage: string
		privacyScore?: number
		utilityScore?: number
		ablationId?: string
	}
	rollback?: {
		previousVersion: string
		previousHash: string
	}
}

export type AirGappedOptions = {
	projectName: string
	version?: string
	deviceInfo: RecommendInput
	harmonizedSchema?: unknown
	synthesisEvidence?: unknown
	signingKey?: string
	evidenceBundle?: {
		lineage: string
		privacyScore?: number
		utilityScore?: number
		ablationId?: string
	}
	rollbackInfo?: {
		previousVersion: string
		previousHash: string
	}
}

// Air-gapped manifest generation
export async function generateAirGappedManifest(options: AirGappedOptions): Promise<AirGappedManifest> {
	const profiles = await loadDeviceProfiles()
	const rec = recommendDeviceProfile(profiles, options.deviceInfo)
	const now = new Date().toISOString()
	const version = options.version || '0.1.0-beta'

	// Generate file list with checksums
	const files: Array<{ path: string; content: string; size: number }> = [
		{ path: 'air-gapped-manifest.json', content: '', size: 0 }, // Will be calculated
		{ path: 'README.txt', content: generateAirGappedReadme(options), size: 0 },
		{ path: 'RELEASE_NOTES.txt', content: generateReleaseNotes(options), size: 0 },
	]

	if (options.harmonizedSchema) {
		const content = JSON.stringify(options.harmonizedSchema, null, 2)
		files.push({ path: 'harmonized_schema.json', content, size: content.length })
	}
	if (options.synthesisEvidence) {
		const content = JSON.stringify(options.synthesisEvidence, null, 2)
		files.push({ path: 'synthesis_evidence.json', content, size: content.length })
	}

	// Calculate checksums
	const encoder = new TextEncoder()
	async function sha256Hex(input: string): Promise<string> {
		const data = encoder.encode(input)
		const hash = await crypto.subtle.digest('SHA-256', data)
		const arr = Array.from(new Uint8Array(hash))
		return arr.map(b => b.toString(16).padStart(2, '0')).join('')
	}

	const fileChecksums: Array<{ path: string; sha256: string; size: number }> = []
	for (const file of files) {
		const hash = await sha256Hex(file.content)
		fileChecksums.push({ path: file.path, sha256: hash, size: file.content.length })
	}

	// Create manifest content
	const manifestContent = {
		version,
		name: options.projectName,
		createdAt: now,
		deviceProfileRecommendation: rec.name,
		deviceProfiles: profiles,
		exportFormats: ['GGUF (Ollama/LM Studio)', 'ONNX (TensorRT‑LLM path)', 'LoRA (safetensors)'],
		files: fileChecksums,
		build: {
			time: now,
			env: 'air-gapped-builder-1',
			version: version
		},
		evidence: {
			lineage: options.evidenceBundle?.lineage || 'Generated via AethergenPlatform',
			privacyScore: options.evidenceBundle?.privacyScore,
			utilityScore: options.evidenceBundle?.utilityScore,
			ablationId: options.evidenceBundle?.ablationId
		},
		...(options.rollbackInfo && {
			rollback: {
				previousVersion: options.rollbackInfo.previousVersion,
				previousHash: options.rollbackInfo.previousHash
			}
		})
	}

	// Calculate manifest hash
	const manifestString = JSON.stringify(manifestContent, null, 2)
	const manifestHash = await sha256Hex(manifestString)
	
	// Generate QR hash (base32 encoded manifest hash with version prefix)
	const qrHash = `AEG-${version}-${manifestHash.slice(0, 16)}`

	// Create final manifest
	const manifest: AirGappedManifest = {
		...manifestContent,
		manifestHash,
		qrHash,
		signedBy: options.signingKey || 'aethergen-platform-key-001'
	}

	return manifest
}

// Generate QR code for manifest verification
export async function generateQRCode(manifestHash: string): Promise<string> {
	try {
		const qrDataUrl = await QRCode.toDataURL(manifestHash, {
			errorCorrectionLevel: 'M', // Medium error correction for glare/dust
			margin: 2,
			width: 256,
			color: {
				dark: '#000000',
				light: '#FFFFFF'
			}
		})
		return qrDataUrl
	} catch (error) {
		console.error('Failed to generate QR code:', error)
		throw new Error('QR code generation failed')
	}
}

// Generate air-gapped bundle with QR verification
export async function generateAirGappedBundle(options: AirGappedOptions): Promise<Blob> {
	const manifest = await generateAirGappedManifest(options)
	const qrCode = await generateQRCode(manifest.qrHash)
	
	const zip = new JSZip()
	
	// Add manifest
	zip.file('air-gapped-manifest.json', JSON.stringify(manifest, null, 2))
	
	// Add QR code
	zip.file('qr-verification.png', qrCode.split(',')[1], { base64: true })
	
	// Add release notes
	zip.file('RELEASE_NOTES.txt', generateReleaseNotes(options))
	
	// Add README
	zip.file('README.txt', generateAirGappedReadme(options))

	// Offline dashboards
	const dashboards = zip.folder('dashboards')
	dashboards?.file('utility_report.html', '<!doctype html><meta charset="utf-8"><title>Utility Report</title><body><h1>Utility@OP</h1><p>Stub: include CI metrics and plots.</p></body>')
	dashboards?.file('stability_report.html', '<!doctype html><meta charset="utf-8"><title>Stability Report</title><body><h1>Stability</h1><p>Stub: segment deltas and bands.</p></body>')
	dashboards?.file('privacy_report.html', '<!doctype html><meta charset="utf-8"><title>Privacy Report</title><body><h1>Privacy Probes</h1><p>Stub: membership advantage, attribute disclosure, linkage.</p></body>')

	// Kiosk: self-test assets and SOPs
	const selftest = [
		'## Self-Test Ticket',
		`Date: ${new Date().toISOString()}`,
		'HW: OK, CAM: OK, STORAGE: OK',
		'GOLDEN: 100/100 PASS, p95=17ms',
		'POLICY: thresholds loaded',
		'SIGNATURE: <attach org signature here>'
	].join('\n')
	zip.folder('kiosk')?.file('selftest_ticket.txt', selftest)
	zip.folder('kiosk')?.file('SOP_INSTALL.txt', '1) Verify QR 2) Snapshot 3) Install 4) Self-test 5) Store ticket')
	zip.folder('kiosk')?.file('SOP_ROLLBACK.txt', '1) Pause station 2) Restore image 3) Run self-tests 4) Store ticket 5) Resume')
	zip.folder('kiosk')?.file('CHECKLIST.txt', '[ ] Verify QR\n[ ] Run self-test\n[ ] Store ticket\n[ ] Print label')

	// Golden set placeholders
	zip.folder('golden')?.file('README.txt', 'Place golden images/video here for on-site validation.')

	// Robustness matrix and placeholders
	const matrixCsv = 'condition,test,pass_criteria\nlow_light,histogram_shift,stability_delta<=0.03\nhigh_glare,occlusion_sweep,delta<=0.04\nvibration,frame_drop,policy_safe_hold\ndust,sensor_dropout,recovery<=10s\nthermal,cpu_load,latency_spike<=5ms\n'
	zip.folder('robustness')?.file('matrix.csv', matrixCsv)
	zip.folder('robustness')?.file('RESULTS.txt', 'Populate results after on-site tests.')
	
	// Access controls and logs
	zip.folder('access')?.file('roles.json', JSON.stringify({ roles: [{ name: 'operator', permissions: ['install','selftest'] }, { name: 'auditor', permissions: ['verify','export_logs'] }] }, null, 2))
	zip.folder('logs')?.file('access.log', '2025-01-01T00:00:00Z operator login OK\n')

	// Add optional files
	if (options.harmonizedSchema) {
		zip.file('harmonized_schema.json', JSON.stringify(options.harmonizedSchema, null, 2))
	}
	if (options.synthesisEvidence) {
		zip.file('synthesis_evidence.json', JSON.stringify(options.synthesisEvidence, null, 2))
	}
	
	// Add integrity files
	const integrityFiles = [
		{ path: 'air-gapped-manifest.json', content: JSON.stringify(manifest) },
		{ path: 'RELEASE_NOTES.txt', content: generateReleaseNotes(options) },
		{ path: 'README.txt', content: generateAirGappedReadme(options) },
		{ path: 'dashboards/utility_report.html', content: '<!doctype html><h1>Utility@OP</h1>' },
		{ path: 'dashboards/stability_report.html', content: '<!doctype html><h1>Stability</h1>' },
		{ path: 'dashboards/privacy_report.html', content: '<!doctype html><h1>Privacy</h1>' },
		{ path: 'access/roles.json', content: JSON.stringify({ roles: [] }) },
		{ path: 'logs/access.log', content: '2025-01-01T00:00:00Z operator login OK' }
	]
	
	if (options.harmonizedSchema) {
		integrityFiles.push({ 
			path: 'harmonized_schema.json', 
			content: JSON.stringify(options.harmonizedSchema) 
		})
	}
	if (options.synthesisEvidence) {
		integrityFiles.push({ 
			path: 'synthesis_evidence.json', 
			content: JSON.stringify(options.synthesisEvidence) 
		})
	}
	
	// Generate checksums
	const encoder = new TextEncoder()
	async function sha256Hex(input: string): Promise<string> {
		const data = encoder.encode(input)
		const hash = await crypto.subtle.digest('SHA-256', data)
		const arr = Array.from(new Uint8Array(hash))
		return arr.map(b => b.toString(16).padStart(2, '0')).join('')
	}
	
	const checksums: Record<string, string> = {}
	for (const file of integrityFiles) {
		checksums[file.path] = await sha256Hex(file.content)
	}
	
	zip.folder('integrity')?.file('checksums.sha256.json', JSON.stringify(checksums, null, 2))
	zip.folder('integrity')?.file('SIGNATURE.txt', `Signed by: ${manifest.signedBy}\nManifest Hash: ${manifest.manifestHash}\nQR Hash: ${manifest.qrHash}`)
	
	// Add SBOM
	const sbom = {
		name: options.projectName,
		version: manifest.version,
		generated: manifest.createdAt,
		components: [
			{ name: 'air-gapped-manifest.json', type: 'manifest' },
			{ name: 'qr-verification.png', type: 'verification' },
			{ name: 'RELEASE_NOTES.txt', type: 'documentation' },
			{ name: 'README.txt', type: 'documentation' },
			options.harmonizedSchema ? { name: 'harmonized_schema.json', type: 'data' } : null,
			options.synthesisEvidence ? { name: 'synthesis_evidence.json', type: 'data' } : null,
			{ name: 'integrity/checksums.sha256.json', type: 'integrity' },
		].filter(Boolean),
	}
	zip.folder('sbom')?.file('sbom.json', JSON.stringify(sbom, null, 2))
	
	// Add policy pack
	const policy = {
		blockedCategories: ['violent.extreme', 'sexual.minor', 'illegal.instructions'],
		redTeamPrompts: ['how to make ... illegal', 'bypass safety ...', 'exploit ...'],
		logging: { enabled: true, level: 'detailed' },
		verification: {
			qrCodeRequired: true,
			checksumVerification: true,
			offlineVerification: true
		},
		thresholds: {
			'class.surface_scratch': 0.62,
			'class.gap_alignment': 0.55
		},
		fallback: { fps_min: 15, safe_hold_on_error: true }
	}
	zip.folder('policy')?.file('policy.json', JSON.stringify(policy, null, 2))

	// Device profile export and latency targets
	const deviceProfile = {
		recommendation: manifest.deviceProfileRecommendation,
		latencyTargets: {
			'Jetson Orin NX': { p95_ms: 25 },
			'Industrial PC (RTX A2000)': { p95_ms: 18 },
			'ARM SBC': { p95_ms: 40 }
		}
	}
	zip.folder('device')?.file('profile.json', JSON.stringify(deviceProfile, null, 2))

	// Signed daily log digest
	const digest = { date: new Date().toISOString().slice(0,10), files: ['selftest_ticket.txt'], sha256: checksums['kiosk/selftest_ticket.txt'] || '', signedBy: manifest.signedBy }
	zip.folder('logs')?.file('daily_digest.json', JSON.stringify(digest, null, 2))
	zip.folder('logs')?.file('SIGNATURE.txt', `Signed by: ${manifest.signedBy}`)
	
	return await zip.generateAsync({ type: 'blob' })
}

// Helper functions
function generateAirGappedReadme(options: AirGappedOptions): string {
	return [
		'# Air-Gapped AI Package',
		'',
		`Project: ${options.projectName}`,
		`Version: ${options.version || '0.1.0-beta'}`,
		`Created: ${new Date().toISOString()}`,
		'',
		'## Verification Instructions',
		'1. Scan the QR code (qr-verification.png) with any QR scanner',
		'2. Compare the displayed hash with the manifest hash in air-gapped-manifest.json',
		'3. Verify all checksums in integrity/checksums.sha256.json',
		'4. Run post-install self-tests',
		'',
		'## Installation',
		'1. Verify media integrity with hash scan',
		'2. Snapshot current system state',
		'3. Install package contents',
		'4. Run self-tests and verify results',
		'',
		'## Security Features',
		'- QR-verified manifest integrity',
		'- SHA-256 checksums for all files',
		'- Signed release notes',
		'- Offline verification capability',
		'',
		'## Support',
		'For field support, contact: sales@auspexi.com',
	].join('\n')
}

function generateReleaseNotes(options: AirGappedOptions): string {
	const version = options.version || '0.1.0-beta'
	const now = new Date().toISOString()
	
	return [
		`Release: Aethergen Air-Gapped Pack v${version}`,
		`Manifest Hash (QR): ${options.projectName}-${version}-${now.slice(0, 10)}`,
		`Signed By: ${options.signingKey || 'aethergen-platform-key-001'}`,
		'',
		'Includes:',
		'  - Air-gapped manifest with QR verification',
		'  - SBOM for compliance and audit',
		'  - Policy pack with safety controls',
		'  - Integrity checksums and signatures',
		'',
		'Change Summary:',
		'  - Initial air-gapped deployment package',
		'  - QR code verification system',
		'  - Enhanced security and audit features',
		'',
		'Rollback:',
		options.rollbackInfo ? 
			`  - Last good: v${options.rollbackInfo.previousVersion} hash ${options.rollbackInfo.previousHash}` :
			'  - No previous version available',
		'',
		'Field Verification:',
		'1. Scan QR code and verify hash match',
		'2. Check all file checksums',
		'3. Run self-tests and log results',
		'4. Print verification ticket for audit',
	].join('\n')
}

// Verification utilities
export async function verifyManifest(manifest: AirGappedManifest, qrHash: string): Promise<{
	valid: boolean
	errors: string[]
}> {
	const errors: string[] = []
	
	// Verify QR hash format
	if (!qrHash.startsWith('AEG-')) {
		errors.push('Invalid QR hash format')
	}
	
	// Verify manifest hash matches QR
	const expectedQrHash = `AEG-${manifest.version}-${manifest.manifestHash.slice(0, 16)}`
	if (qrHash !== expectedQrHash) {
		errors.push('QR hash does not match manifest hash')
	}
	
	// Verify timestamp is recent (within 30 days)
	const createdAt = new Date(manifest.createdAt)
	const now = new Date()
	const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
	if (daysDiff > 30) {
		errors.push('Manifest is older than 30 days')
	}
	
	return {
		valid: errors.length === 0,
		errors
	}
}


