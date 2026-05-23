export type DetectedDevice = {
	approxVramGB: number
	gpuVendor: string
	browser: string
}

// Browser cannot read VRAM directly; we use coarse heuristics.
export function detectDeviceHeuristic(): DetectedDevice {
	const ua = navigator.userAgent
	const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 'Other'
	const gpuVendor = (navigator as any).gpu ? 'WebGPU' : 'Unknown'
	// Use screen size + performance hint as crude proxy
	const pixels = window.screen.width * window.screen.height
	const perf = (performance as any)?.memory?.jsHeapSizeLimit || 0
	let approxVramGB = 8
	if (pixels >= 8_000_000) approxVramGB = 12
	if (perf > 3_000_000_000) approxVramGB = Math.max(approxVramGB, 12)
	return { approxVramGB, gpuVendor, browser }
}


