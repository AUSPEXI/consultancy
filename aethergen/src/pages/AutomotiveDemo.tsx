import React, { useState } from 'react'
import { Download, QrCode, Shield, CheckCircle, FileText, Package, Settings, Camera, Wrench, AlertTriangle } from 'lucide-react'
import { automotiveEdgeService, AutomotiveEdgeOptions } from '../services/automotiveEdgeService'
import { goldenRunService, TimingBudget, ReworkConfig } from '../services/goldenRunService'

export const AutomotiveDemo: React.FC = () => {
	const [generationStatus, setGenerationStatus] = useState<string>('')
	const [bundleInfo, setBundleInfo] = useState<any>(null)
	const [goldenRunStatus, setGoldenRunStatus] = useState<string>('')
	const [maintenanceStatus, setMaintenanceStatus] = useState<string>('')
	const [calibrationStatus, setCalibrationStatus] = useState<string>('')
	const [selectedStationType, setSelectedStationType] = useState<'surface' | 'assembly' | 'electrical' | 'interior'>('surface')

	// Demo configuration
	const demoOptions: AutomotiveEdgeOptions = {
		projectName: 'automotive-quality-demo',
		modelName: 'automotive-defect-detector',
		modelVersion: '1.0.0',
		deviceProfile: 'Jetson Orin 16GB',
		exportFormats: ['INT8', 'Q4', 'FP16'],
		includeEvidence: true,
		includePolicyPack: true,
		stationType: selectedStationType,
		defectClasses: getDefectClassesForStationType(selectedStationType),
		timingBudget: getTimingBudgetForStationType(selectedStationType),
		reworkIntegration: getDefaultReworkConfig(),
		lightingProfiles: ['day', 'night', 'mixed']
	}

	// Generate automotive edge package
	const generateAutomotivePackage = async () => {
		setGenerationStatus('Generating automotive edge package...')
		try {
			const options = { ...demoOptions, stationType: selectedStationType }
			const bundle = await automotiveEdgeService.generateAutomotiveEdgeBundle(options)
			setBundleInfo(bundle)
			setGenerationStatus('✅ Automotive edge package generated successfully!')
		} catch (error) {
			setGenerationStatus(`❌ Error: ${error}`)
		}
	}

	// Download automotive package
	const downloadAutomotivePackage = async () => {
		if (!bundleInfo) return
		
		setGenerationStatus('Creating downloadable package...')
		try {
			const options = { ...demoOptions, stationType: selectedStationType }
			const blob = await automotiveEdgeService.createAutomotiveEdgePackage(options)
			
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `automotive-${selectedStationType}-bundle.zip`
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			URL.revokeObjectURL(url)
			
			setGenerationStatus('✅ Automotive package downloaded!')
		} catch (error) {
			setGenerationStatus(`❌ Download error: ${error}`)
		}
	}

	// Create golden run
	const createGoldenRun = async () => {
		setGoldenRunStatus('Creating golden run...')
		try {
			const goldenRun = await goldenRunService.createGoldenRun(
				`station-${selectedStationType}`,
				selectedStationType,
				'operator-001',
				'day',
				'LOT-2025-001'
			)
			setGoldenRunStatus(`✅ Golden run created: ${goldenRun.id}`)
		} catch (error) {
			setGoldenRunStatus(`❌ Error: ${error}`)
		}
	}

	// Enter maintenance mode
	const enterMaintenanceMode = async () => {
		setMaintenanceStatus('Entering maintenance mode...')
		try {
			const result = await goldenRunService.enterMaintenanceMode(`station-${selectedStationType}`)
			setMaintenanceStatus(`✅ Maintenance mode entered: ${result.maintenanceId}`)
		} catch (error) {
			setMaintenanceStatus(`❌ Error: ${error}`)
		}
	}

	// Recalibrate camera
	const recalibrateCamera = async () => {
		setCalibrationStatus('Recalibrating camera...')
		try {
			const result = await goldenRunService.recalibrateCamera(`station-${selectedStationType}`, {
				cameraPosition: { x: 0, y: 0, z: 150, rotation: 0 },
				lightingProfile: 'standard',
				histogramBaseline: [0.25, 0.3, 0.3, 0.15],
				lastCalibrated: new Date().toISOString(),
				calibratedBy: 'maintenance-operator'
			})
			setCalibrationStatus(`✅ Camera recalibrated: ${result.success ? 'Success' : 'Failed'}`)
		} catch (error) {
			setCalibrationStatus(`❌ Error: ${error}`)
		}
	}

	// Re-run golden set
	const reRunGoldenSet = async () => {
		setGoldenRunStatus('Re-running golden set...')
		try {
			const result = await goldenRunService.reRunGoldenSet(`station-${selectedStationType}`)
			setGoldenRunStatus(`✅ Golden set re-run: ${result.recommendation}`)
		} catch (error) {
			setGoldenRunStatus(`❌ Error: ${error}`)
		}
	}

	// Handle failure mode
	const handleFailureMode = async (failureType: 'camera_dropout' | 'lighting_shift' | 'model_error_spike') => {
		setMaintenanceStatus(`Handling ${failureType}...`)
		try {
			const result = await goldenRunService.handleFailureMode(`station-${selectedStationType}`, failureType)
			setMaintenanceStatus(`✅ ${failureType} handled: ${result.action}`)
		} catch (error) {
			setMaintenanceStatus(`❌ Error: ${error}`)
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						🚗 Automotive Quality Control Demo
					</h1>
					<p className="text-xl text-gray-900 max-w-3xl mx-auto">
						Experience the complete automotive quality control system with golden runs, 
						calibration workflows, maintenance procedures, and edge packaging.
					</p>
				</div>

				{/* Station Type Selection */}
				<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
						<Settings className="w-6 h-6 mr-2" />
						Station Configuration
					</h2>
					
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
						{['surface', 'assembly', 'electrical', 'interior'].map((type) => (
							<button
								key={type}
								onClick={() => setSelectedStationType(type as any)}
								className={`p-4 rounded-lg border-2 transition-all ${
									selectedStationType === type
										? 'border-blue-500 bg-blue-50 text-blue-700'
										: 'border-gray-200 hover:border-gray-300'
								}`}
							>
								<div className="font-semibold capitalize">{type}</div>
								<div className="text-sm text-gray-900 mt-1">
									{getStationDescription(type)}
								</div>
							</button>
						))}
					</div>

					<div className="bg-gray-50 rounded-lg p-4">
						<h3 className="font-semibold mb-2">Current Configuration:</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div>
								<strong>Station Type:</strong> {selectedStationType}
							</div>
							<div>
								<strong>Defect Classes:</strong> {getDefectClassesForStationType(selectedStationType).length}
							</div>
							<div>
								<strong>Timing Budget:</strong> {getTimingBudgetForStationType(selectedStationType).total.max}ms
							</div>
							<div>
								<strong>Device Profile:</strong> {getDeviceProfileRecommendation(selectedStationType)}
							</div>
						</div>
					</div>
				</div>

				{/* Golden Run System */}
				<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
						<CheckCircle className="w-6 h-6 mr-2" />
						Golden Run System
					</h2>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<div className="space-y-4">
							<button
								onClick={createGoldenRun}
								className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
							>
								<CheckCircle className="w-5 h-5 mr-2" />
								Create Golden Run
							</button>
							
							<button
								onClick={reRunGoldenSet}
								className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
							>
								<FileText className="w-5 h-5 mr-2" />
								Re-run Golden Set
							</button>
						</div>
						
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="font-semibold mb-2 text-gray-900">Golden Run Status:</h3>
							<p className="text-sm text-gray-900">{goldenRunStatus || 'Ready to create golden run'}</p>
						</div>
					</div>
				</div>

				{/* Maintenance & Calibration */}
				<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
						<Wrench className="w-6 h-6 mr-2" />
						Maintenance & Calibration
					</h2>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<div className="space-y-4">
							<button
								onClick={enterMaintenanceMode}
								className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center"
							>
								<Settings className="w-5 h-5 mr-2" />
								Enter Maintenance Mode
							</button>
							
							<button
								onClick={recalibrateCamera}
								className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
							>
								<Camera className="w-5 h-5 mr-2" />
								Recalibrate Camera
							</button>
						</div>
						
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="font-semibold mb-2">Maintenance Status:</h3>
							<p className="text-sm text-gray-600 mb-4">{maintenanceStatus || 'Ready for maintenance'}</p>
							<h3 className="font-semibold mb-2">Calibration Status:</h3>
							<p className="text-sm text-gray-600">{calibrationStatus || 'Ready for calibration'}</p>
						</div>
					</div>

					{/* Failure Mode Handling */}
					<div className="border-t pt-6">
						<h3 className="font-semibold mb-4 flex items-center">
							<AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
							Failure Mode Handling
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<button
								onClick={() => handleFailureMode('camera_dropout')}
								className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
							>
								Camera Dropout
							</button>
							<button
								onClick={() => handleFailureMode('lighting_shift')}
								className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
							>
								Lighting Shift
							</button>
							<button
								onClick={() => handleFailureMode('model_error_spike')}
								className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
							>
								Model Error Spike
							</button>
						</div>
					</div>
				</div>

				{/* Edge Package Generation */}
				<div className="bg-white rounded-lg shadow-lg p-6 mb-8">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
						<Package className="w-6 h-6 mr-2" />
						Automotive Edge Package
					</h2>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
						<div className="space-y-4">
							<button
								onClick={generateAutomotivePackage}
								className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
							>
								<Package className="w-5 h-5 mr-2" />
								Generate Automotive Package
							</button>
							
							{bundleInfo && (
								<button
									onClick={downloadAutomotivePackage}
									className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
								>
									<Download className="w-5 h-5 mr-2" />
									Download Package
								</button>
							)}
						</div>
						
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="font-semibold mb-2">Generation Status:</h3>
							<p className="text-sm text-gray-600 mb-4">{generationStatus || 'Ready to generate package'}</p>
							
							{bundleInfo && (
								<div>
									<h3 className="font-semibold mb-2">Bundle Info:</h3>
									<div className="text-sm text-gray-600 space-y-1">
										<div><strong>ID:</strong> {bundleInfo.id}</div>
										<div><strong>Station:</strong> {bundleInfo.stationId}</div>
										<div><strong>Type:</strong> {bundleInfo.stationType}</div>
										<div><strong>Version:</strong> {bundleInfo.version}</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Package Contents Preview */}
					{bundleInfo && (
						<div className="border-t pt-6">
							<h3 className="font-semibold mb-4">Package Contents:</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
								<div className="bg-blue-50 p-3 rounded-lg">
									<strong>📄 Manifest</strong>
									<div className="text-gray-600">Air-gapped manifest with QR verification</div>
								</div>
								<div className="bg-green-50 p-3 rounded-lg">
									<strong>🔧 Station Config</strong>
									<div className="text-gray-600">Station-specific configuration</div>
								</div>
								<div className="bg-purple-50 p-3 rounded-lg">
									<strong>📊 Evidence Bundle</strong>
									<div className="text-gray-600">QA and procurement evidence</div>
								</div>
								<div className="bg-orange-50 p-3 rounded-lg">
									<strong>⚙️ Policy Pack</strong>
									<div className="text-gray-600">Thresholds and failure modes</div>
								</div>
								<div className="bg-red-50 p-3 rounded-lg">
									<strong>🖥️ Device Profile</strong>
									<div className="text-gray-600">Hardware recommendations</div>
								</div>
								<div className="bg-yellow-50 p-3 rounded-lg">
									<strong>🔧 Maintenance SOP</strong>
									<div className="text-gray-600">Maintenance procedures</div>
								</div>
								<div className="bg-indigo-50 p-3 rounded-lg">
									<strong>📐 Calibration Guide</strong>
									<div className="text-gray-600">Calibration instructions</div>
								</div>
								<div className="bg-pink-50 p-3 rounded-lg">
									<strong>🔄 Rework Integration</strong>
									<div className="text-gray-600">Rework cell integration</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Features Overview */}
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
						<Shield className="w-6 h-6 mr-2" />
						Automotive Quality Control Features
					</h2>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div className="bg-blue-50 p-4 rounded-lg">
							<h3 className="font-semibold text-blue-900 mb-2">Golden Run Protocol</h3>
							<ul className="text-sm text-blue-700 space-y-1">
								<li>• Capture golden images after calibration</li>
								<li>• Run model with full verbosity logging</li>
								<li>• Freeze operating points</li>
								<li>• Store signed evidence</li>
							</ul>
						</div>
						
						<div className="bg-green-50 p-4 rounded-lg">
							<h3 className="font-semibold text-green-900 mb-2">Timing Budgets</h3>
							<ul className="text-sm text-green-700 space-y-1">
								<li>• Capture: 1-3ms</li>
								<li>• Preprocess: 1-5ms</li>
								<li>• Inference: 3-25ms</li>
								<li>• Policy & I/O: 1-5ms</li>
							</ul>
						</div>
						
						<div className="bg-purple-50 p-4 rounded-lg">
							<h3 className="font-semibold text-purple-900 mb-2">Failure Modes</h3>
							<ul className="text-sm text-purple-700 space-y-1">
								<li>• Camera dropout → redundant sensor</li>
								<li>• Lighting shift → auto-adjust profile</li>
								<li>• Model error spike → revert operating point</li>
								<li>• Automatic recovery procedures</li>
							</ul>
						</div>
						
						<div className="bg-orange-50 p-4 rounded-lg">
							<h3 className="font-semibold text-orange-900 mb-2">Evidence Bundles</h3>
							<ul className="text-sm text-orange-700 space-y-1">
								<li>• Model cards with performance metrics</li>
								<li>• Operating points with confidence intervals</li>
								<li>• Traceability linking decisions</li>
								<li>• SBOM and signed manifests</li>
							</ul>
						</div>
						
						<div className="bg-red-50 p-4 rounded-lg">
							<h3 className="font-semibold text-red-900 mb-2">Rework Integration</h3>
							<ul className="text-sm text-red-700 space-y-1">
								<li>• Automatic routing to rework cells</li>
								<li>• Evidence linking to original frames</li>
								<li>• Decision context tracking</li>
								<li>• Audit trail generation</li>
							</ul>
						</div>
						
						<div className="bg-indigo-50 p-4 rounded-lg">
							<h3 className="font-semibold text-indigo-900 mb-2">Maintenance SOP</h3>
							<ul className="text-sm text-indigo-700 space-y-1">
								<li>• Enter maintenance mode</li>
								<li>• Snapshot current state</li>
								<li>• Recalibrate camera/lighting</li>
								<li>• Re-run golden set validation</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// Helper functions
function getDefectClassesForStationType(stationType: string): string[] {
	const defectClasses: Record<string, string[]> = {
		surface: ['paint_flaw', 'scratch', 'dent', 'contamination'],
		assembly: ['missing_fastener', 'gap_issue', 'misalignment', 'loose_part'],
		electrical: ['missing_connector', 'damaged_wire', 'faulty_indicator', 'short_circuit'],
		interior: ['stitching_issue', 'wrinkle', 'fit_problem', 'material_defect']
	}
	return defectClasses[stationType] || defectClasses.surface
}

function getTimingBudgetForStationType(stationType: string): TimingBudget {
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

function getDefaultReworkConfig(): ReworkConfig {
	return {
		severityThresholds: {
			critical: 0.90,
			major: 0.75,
			minor: 0.60
		},
		automaticRouting: true,
		reworkCellId: 'rework-cell-001',
		escalationPolicy: 'immediate',
		evidenceRetention: 'all'
	}
}

function getStationDescription(stationType: string): string {
	const descriptions: Record<string, string> = {
		surface: 'Paint, scratches, dents',
		assembly: 'Fasteners, gaps, alignment',
		electrical: 'Connectors, indicators',
		interior: 'Stitching, wrinkles, fit'
	}
	return descriptions[stationType] || 'Quality control'
}

function getDeviceProfileRecommendation(stationType: string): string {
	const recommendations: Record<string, string> = {
		surface: 'Jetson Orin 16GB',
		assembly: 'Industrial PC RTX A2000',
		electrical: 'Jetson Orin NX',
		interior: 'Industrial PC RTX A1000'
	}
	return recommendations[stationType] || recommendations.surface
}
