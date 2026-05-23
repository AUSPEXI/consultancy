export interface GoldenRun {
	id: string
	stationId: string
	stationType: 'surface' | 'assembly' | 'electrical' | 'interior'
	capturedAt: string
	images: GoldenImage[]
	baselineMetrics: StationMetrics
	signedEvidence: string
	calibrationState: CalibrationState
	operator: string
	shift: string
	lot: string
	version: string
}

export interface GoldenImage {
	id: string
	path: string
	hash: string
	capturedAt: string
	lightingProfile: string
	cameraSettings: CameraSettings
	metadata: Record<string, any>
}

export interface StationMetrics {
	perClassSensitivity: Record<string, number>
	perClassSpecificity: Record<string, number>
	operatingPoints: Record<string, number>
	confidenceIntervals: Record<string, { lower: number; upper: number }>
	throughputImpact: number // units/hour
	falseCallCost: number
	reworkMinutesPer1k: number
	stabilityScore: number
}

export interface CalibrationState {
	cameraPosition: { x: number; y: number; z: number; rotation: number }
	lightingProfile: string
	histogramBaseline: number[]
	alignmentTargets: AlignmentTarget[]
	toolingChanges: ToolingChange[]
	lastCalibrated: string
	calibratedBy: string
}

export interface CameraSettings {
	exposure: number
	gain: number
	whiteBalance: { r: number; g: number; b: number }
	focus: number
	aperture: number
	resolution: { width: number; height: number }
}

export interface AlignmentTarget {
	id: string
	position: { x: number; y: number }
	expectedSize: { width: number; height: number }
	tolerance: number
}

export interface ToolingChange {
	id: string
	description: string
	changedAt: string
	changedBy: string
	metadata: Record<string, any>
}

export interface TimingBudget {
	capture: { min: number; max: number } // ms
	preprocess: { min: number; max: number } // ms
	inference: { min: number; max: number } // ms
	policyAndIO: { min: number; max: number } // ms
	total: { min: number; max: number } // ms
}

export interface ReworkConfig {
	severityThresholds: Record<string, number>
	automaticRouting: boolean
	reworkCellId?: string
	escalationPolicy: 'immediate' | 'batch' | 'manual'
	evidenceRetention: 'all' | 'flagged' | 'sample'
}

class GoldenRunService {
	private goldenRuns: Map<string, GoldenRun> = new Map()
	private calibrationStates: Map<string, CalibrationState> = new Map()

	// Create a new golden run for a station
	async createGoldenRun(
		stationId: string,
		stationType: 'surface' | 'assembly' | 'electrical' | 'interior',
		operator: string,
		shift: string,
		lot: string
	): Promise<GoldenRun> {
		const id = `golden-${stationId}-${Date.now()}`
		
		// Get current calibration state
		const calibrationState = this.calibrationStates.get(stationId) || this.getDefaultCalibrationState()
		
		// Capture golden images (simulated)
		const images = await this.captureGoldenImages(stationId, stationType)
		
		// Run baseline metrics
		const baselineMetrics = await this.calculateBaselineMetrics(images, stationType)
		
		// Sign the evidence
		const signedEvidence = await this.signEvidence(baselineMetrics, images)
		
		const goldenRun: GoldenRun = {
			id,
			stationId,
			stationType,
			capturedAt: new Date().toISOString(),
			images,
			baselineMetrics,
			signedEvidence,
			calibrationState,
			operator,
			shift,
			lot,
			version: '1.0.0'
		}

		this.goldenRuns.set(id, goldenRun)
		return goldenRun
	}

	// Enter maintenance mode and snapshot current state
	async enterMaintenanceMode(stationId: string): Promise<{
		maintenanceId: string
		snapshot: StationState
	}> {
		const maintenanceId = `maintenance-${stationId}-${Date.now()}`
		
		// Snapshot current state
		const snapshot: StationState = {
			stationId,
			snapshotAt: new Date().toISOString(),
			calibrationState: this.calibrationStates.get(stationId) || this.getDefaultCalibrationState(),
			operatingPoints: await this.getCurrentOperatingPoints(stationId),
			policySettings: await this.getCurrentPolicySettings(stationId),
			lastGoldenRun: await this.getLastGoldenRun(stationId)
		}

		return { maintenanceId, snapshot }
	}

	// Recalibrate camera and lighting
	async recalibrateCamera(
		stationId: string,
		calibrationData: Partial<CalibrationState>
	): Promise<CalibrationResult> {
		const currentState = this.calibrationStates.get(stationId) || this.getDefaultCalibrationState()
		
		// Apply calibration changes
		const newState: CalibrationState = {
			...currentState,
			...calibrationData,
			lastCalibrated: new Date().toISOString(),
			calibratedBy: 'maintenance-operator'
		}

		this.calibrationStates.set(stationId, newState)

		// Validate calibration
		const validationResult = await this.validateCalibration(newState)

		return {
			success: validationResult.isValid,
			calibrationState: newState,
			validationErrors: validationResult.errors,
			calibratedAt: new Date().toISOString()
		}
	}

	// Re-run golden set and compare drift
	async reRunGoldenSet(stationId: string): Promise<ValidationResult> {
		const lastGoldenRun = await this.getLastGoldenRun(stationId)
		if (!lastGoldenRun) {
			throw new Error('No previous golden run found')
		}

		// Capture new images
		const newImages = await this.captureGoldenImages(stationId, lastGoldenRun.stationType)
		
		// Calculate new metrics
		const newMetrics = await this.calculateBaselineMetrics(newImages, lastGoldenRun.stationType)
		
		// Compare with baseline
		const driftAnalysis = this.analyzeDrift(lastGoldenRun.baselineMetrics, newMetrics)
		
		// Determine if drift is acceptable
		const isAcceptable = this.isDriftAcceptable(driftAnalysis)

		return {
			isValid: isAcceptable,
			driftAnalysis,
			newMetrics,
			baselineMetrics: lastGoldenRun.baselineMetrics,
			recommendation: isAcceptable ? 'accept' : 'reject',
			validationAt: new Date().toISOString()
		}
	}

	// Get timing budget for a station
	async getTimingBudget(stationType: string): Promise<TimingBudget> {
		const budgets: Record<string, TimingBudget> = {
			surface: {
				capture: { min: 1, max: 3 },
				preprocess: { min: 2, max: 5 },
				inference: { min: 5, max: 15 },
				policyAndIO: { min: 1, max: 3 },
				total: { min: 9, max: 26 }
			},
			assembly: {
				capture: { min: 1, max: 2 },
				preprocess: { min: 1, max: 3 },
				inference: { min: 3, max: 10 },
				policyAndIO: { min: 1, max: 2 },
				total: { min: 6, max: 17 }
			},
			electrical: {
				capture: { min: 1, max: 2 },
				preprocess: { min: 1, max: 2 },
				inference: { min: 2, max: 8 },
				policyAndIO: { min: 1, max: 2 },
				total: { min: 5, max: 14 }
			},
			interior: {
				capture: { min: 1, max: 3 },
				preprocess: { min: 2, max: 4 },
				inference: { min: 4, max: 12 },
				policyAndIO: { min: 1, max: 3 },
				total: { min: 8, max: 22 }
			}
		}

		return budgets[stationType] || budgets.surface
	}

	// Handle failure modes
	async handleFailureMode(
		stationId: string,
		failureType: 'camera_dropout' | 'lighting_shift' | 'model_error_spike'
	): Promise<FailureResponse> {
		switch (failureType) {
			case 'camera_dropout':
				return this.handleCameraDropout(stationId)
			case 'lighting_shift':
				return this.handleLightingShift(stationId)
			case 'model_error_spike':
				return this.handleModelErrorSpike(stationId)
			default:
				throw new Error(`Unknown failure type: ${failureType}`)
		}
	}

	// Export golden run for evidence bundle
	async exportGoldenRunForEvidence(goldenRunId: string): Promise<GoldenRunEvidence> {
		const goldenRun = this.goldenRuns.get(goldenRunId)
		if (!goldenRun) {
			throw new Error('Golden run not found')
		}

		return {
			goldenRunId,
			stationId: goldenRun.stationId,
			stationType: goldenRun.stationType,
			capturedAt: goldenRun.capturedAt,
			baselineMetrics: goldenRun.baselineMetrics,
			calibrationState: goldenRun.calibrationState,
			imageHashes: goldenRun.images.map(img => img.hash),
			signedEvidence: goldenRun.signedEvidence,
			operator: goldenRun.operator,
			shift: goldenRun.shift,
			lot: goldenRun.lot,
			version: goldenRun.version,
			exportedAt: new Date().toISOString()
		}
	}

	// Private helper methods
	private async captureGoldenImages(stationId: string, stationType: string): Promise<GoldenImage[]> {
		// Simulate capturing golden images
		const imageCount = stationType === 'surface' ? 10 : 5
		const images: GoldenImage[] = []

		for (let i = 0; i < imageCount; i++) {
			const image: GoldenImage = {
				id: `img-${stationId}-${Date.now()}-${i}`,
				path: `/golden-images/${stationId}/golden-${i}.jpg`,
				hash: `sha256-golden-${stationId}-${i}-${Math.random().toString(36).substr(2, 16)}`,
				capturedAt: new Date().toISOString(),
				lightingProfile: 'standard',
				cameraSettings: {
					exposure: 1/60,
					gain: 1.0,
					whiteBalance: { r: 1.0, g: 1.0, b: 1.0 },
					focus: 50,
					aperture: 2.8,
					resolution: { width: 1920, height: 1080 }
				},
				metadata: {
					imageIndex: i,
					stationType,
					lightingCondition: 'standard'
				}
			}
			images.push(image)
		}

		return images
	}

	private async calculateBaselineMetrics(images: GoldenImage[], stationType: string): Promise<StationMetrics> {
		// Simulate calculating baseline metrics
		const defectClasses = this.getDefectClassesForStationType(stationType)
		
		const metrics: StationMetrics = {
			perClassSensitivity: {},
			perClassSpecificity: {},
			operatingPoints: {},
			confidenceIntervals: {},
			throughputImpact: 100, // units/hour
			falseCallCost: 0.05, // cost per false call
			reworkMinutesPer1k: 15, // minutes per 1000 units
			stabilityScore: 0.95
		}

		// Populate per-class metrics
		defectClasses.forEach(className => {
			metrics.perClassSensitivity[className] = 0.85 + Math.random() * 0.1
			metrics.perClassSpecificity[className] = 0.90 + Math.random() * 0.08
			metrics.operatingPoints[className] = 0.75 + Math.random() * 0.2
			metrics.confidenceIntervals[className] = {
				lower: 0.80 + Math.random() * 0.1,
				upper: 0.90 + Math.random() * 0.1
			}
		})

		return metrics
	}

	private async signEvidence(metrics: StationMetrics, images: GoldenImage[]): Promise<string> {
		// Simulate signing evidence
		const evidenceData = {
			metrics,
			imageHashes: images.map(img => img.hash),
			timestamp: new Date().toISOString(),
			version: '1.0.0'
		}
		
		const evidenceString = JSON.stringify(evidenceData)
		return `aeg-sig-${Buffer.from(evidenceString).toString('base64').substr(0, 32)}`
	}

	private getDefaultCalibrationState(): CalibrationState {
		return {
			cameraPosition: { x: 0, y: 0, z: 100, rotation: 0 },
			lightingProfile: 'standard',
			histogramBaseline: [0.2, 0.3, 0.3, 0.2],
			alignmentTargets: [],
			toolingChanges: [],
			lastCalibrated: new Date().toISOString(),
			calibratedBy: 'system'
		}
	}

	private getDefectClassesForStationType(stationType: string): string[] {
		const defectClasses: Record<string, string[]> = {
			surface: ['paint_flaw', 'scratch', 'dent', 'contamination'],
			assembly: ['missing_fastener', 'gap_issue', 'misalignment', 'loose_part'],
			electrical: ['missing_connector', 'damaged_wire', 'faulty_indicator', 'short_circuit'],
			interior: ['stitching_issue', 'wrinkle', 'fit_problem', 'material_defect']
		}
		return defectClasses[stationType] || defectClasses.surface
	}

	private async getCurrentOperatingPoints(stationId: string): Promise<Record<string, number>> {
		// Simulate getting current operating points
		return {
			'paint_flaw': 0.75,
			'scratch': 0.80,
			'dent': 0.85,
			'contamination': 0.70
		}
	}

	private async getCurrentPolicySettings(stationId: string): Promise<Record<string, any>> {
		// Simulate getting current policy settings
		return {
			severityThresholds: {
				critical: 0.90,
				major: 0.75,
				minor: 0.60
			},
			automaticRouting: true,
			escalationPolicy: 'immediate'
		}
	}

	private async getLastGoldenRun(stationId: string): Promise<GoldenRun | null> {
		// Find the most recent golden run for this station
		const runs = Array.from(this.goldenRuns.values())
			.filter(run => run.stationId === stationId)
			.sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
		
		return runs[0] || null
	}

	private async validateCalibration(calibrationState: CalibrationState): Promise<{ isValid: boolean; errors: string[] }> {
		const errors: string[] = []
		
		// Basic validation
		if (calibrationState.cameraPosition.z < 50) {
			errors.push('Camera too close to target')
		}
		if (calibrationState.histogramBaseline.length === 0) {
			errors.push('No histogram baseline data')
		}
		
		return {
			isValid: errors.length === 0,
			errors
		}
	}

	private analyzeDrift(baseline: StationMetrics, current: StationMetrics): DriftAnalysis {
		const drift: DriftAnalysis = {
			perClassDrift: {},
			overallDrift: 0,
			driftSeverity: 'low',
			recommendations: []
		}

		// Calculate drift for each class
		Object.keys(baseline.perClassSensitivity).forEach(className => {
			const baselineSens = baseline.perClassSensitivity[className]
			const currentSens = current.perClassSensitivity[className]
			const drift = Math.abs(currentSens - baselineSens)
			
			drift.perClassDrift[className] = {
				sensitivity: drift,
				threshold: 0.05,
				isSignificant: drift > 0.05
			}
		})

		// Calculate overall drift
		const totalDrift = Object.values(drift.perClassDrift)
			.reduce((sum, classDrift) => sum + classDrift.sensitivity, 0) / Object.keys(drift.perClassDrift).length
		
		drift.overallDrift = totalDrift
		drift.driftSeverity = totalDrift > 0.1 ? 'high' : totalDrift > 0.05 ? 'medium' : 'low'

		if (drift.driftSeverity === 'high') {
			drift.recommendations.push('Recalibrate camera and lighting')
			drift.recommendations.push('Review recent tooling changes')
		} else if (drift.driftSeverity === 'medium') {
			drift.recommendations.push('Monitor drift trends')
		}

		return drift
	}

	private isDriftAcceptable(driftAnalysis: DriftAnalysis): boolean {
		return driftAnalysis.driftSeverity === 'low' || driftAnalysis.driftSeverity === 'medium'
	}

	private async handleCameraDropout(stationId: string): Promise<FailureResponse> {
		return {
			success: true,
			action: 'failover_to_redundant_sensor',
			alertOperator: true,
			recoveryTime: 'immediate',
			loggedAt: new Date().toISOString()
		}
	}

	private async handleLightingShift(stationId: string): Promise<FailureResponse> {
		return {
			success: true,
			action: 'auto_adjust_profile',
			alertOperator: true,
			recoveryTime: 'within_5_seconds',
			loggedAt: new Date().toISOString()
		}
	}

	private async handleModelErrorSpike(stationId: string): Promise<FailureResponse> {
		return {
			success: true,
			action: 'revert_to_last_good_operating_point',
			alertOperator: true,
			recoveryTime: 'within_10_seconds',
			loggedAt: new Date().toISOString()
		}
	}
}

// Supporting interfaces
export interface StationState {
	stationId: string
	snapshotAt: string
	calibrationState: CalibrationState
	operatingPoints: Record<string, number>
	policySettings: Record<string, any>
	lastGoldenRun: GoldenRun | null
}

export interface CalibrationResult {
	success: boolean
	calibrationState: CalibrationState
	validationErrors: string[]
	calibratedAt: string
}

export interface ValidationResult {
	isValid: boolean
	driftAnalysis: DriftAnalysis
	newMetrics: StationMetrics
	baselineMetrics: StationMetrics
	recommendation: 'accept' | 'reject'
	validationAt: string
}

export interface DriftAnalysis {
	perClassDrift: Record<string, {
		sensitivity: number
		threshold: number
		isSignificant: boolean
	}>
	overallDrift: number
	driftSeverity: 'low' | 'medium' | 'high'
	recommendations: string[]
}

export interface FailureResponse {
	success: boolean
	action: string
	alertOperator: boolean
	recoveryTime: string
	loggedAt: string
}

export interface GoldenRunEvidence {
	goldenRunId: string
	stationId: string
	stationType: string
	capturedAt: string
	baselineMetrics: StationMetrics
	calibrationState: CalibrationState
	imageHashes: string[]
	signedEvidence: string
	operator: string
	shift: string
	lot: string
	version: string
	exportedAt: string
}

// Export singleton instance
export const goldenRunService = new GoldenRunService()
