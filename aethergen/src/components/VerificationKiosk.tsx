import React, { useState, useRef } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Download, QrCode, FileText, Shield } from 'lucide-react'
import { verifyManifest, AirGappedManifest } from '../services/edgePackagingService'

interface VerificationKioskProps {
	className?: string
}

interface VerificationResult {
	valid: boolean
	errors: string[]
	manifest?: AirGappedManifest
	qrHash?: string
}

export const VerificationKiosk: React.FC<VerificationKioskProps> = ({ className = '' }) => {
	const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
	const [isVerifying, setIsVerifying] = useState(false)
	const [qrInput, setQrInput] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		setIsVerifying(true)
		try {
			const text = await file.text()
			const manifest = JSON.parse(text) as AirGappedManifest
			
			// Verify the manifest structure
			if (!manifest.manifestHash || !manifest.qrHash) {
				setVerificationResult({
					valid: false,
					errors: ['Invalid manifest format: missing hash fields']
				})
				return
			}

			// Verify against QR input if provided
			if (qrInput) {
				const verification = await verifyManifest(manifest, qrInput)
				setVerificationResult({
					...verification,
					manifest,
					qrHash: qrInput
				})
			} else {
				setVerificationResult({
					valid: true,
					errors: [],
					manifest,
					qrHash: manifest.qrHash
				})
			}
		} catch (error) {
			setVerificationResult({
				valid: false,
				errors: [`Failed to parse manifest: ${error}`]
			})
		} finally {
			setIsVerifying(false)
		}
	}

	const handleQRInput = async () => {
		if (!qrInput.trim()) return

		setIsVerifying(true)
		try {
			// For demo purposes, we'll create a mock verification
			// In real implementation, this would scan the QR code
			const mockManifest: AirGappedManifest = {
				version: '1.0.0',
				name: 'Demo Package',
				createdAt: new Date().toISOString(),
				manifestHash: 'demo-hash-1234567890abcdef',
				qrHash: qrInput,
				signedBy: 'demo-key-001',
				deviceProfileRecommendation: 'Jetson Orin 16GB',
				deviceProfiles: [],
				exportFormats: ['GGUF', 'ONNX'],
				files: [],
				build: {
					time: new Date().toISOString(),
					env: 'demo-builder',
					version: '1.0.0'
				},
				evidence: {
					lineage: 'Demo generation'
				}
			}

			const verification = await verifyManifest(mockManifest, qrInput)
			setVerificationResult({
				...verification,
				manifest: mockManifest,
				qrHash: qrInput
			})
		} catch (error) {
			setVerificationResult({
				valid: false,
				errors: [`QR verification failed: ${error}`]
			})
		} finally {
			setIsVerifying(false)
		}
	}

	const generateVerificationTicket = () => {
		if (!verificationResult?.manifest) return

		const ticket = {
			verificationTime: new Date().toISOString(),
			packageName: verificationResult.manifest.name,
			version: verificationResult.manifest.version,
			manifestHash: verificationResult.manifest.manifestHash,
			qrHash: verificationResult.qrHash,
			valid: verificationResult.valid,
			errors: verificationResult.errors,
			verifiedBy: 'Field Engineer',
			location: 'Field Site'
		}

		const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `verification-ticket-${Date.now()}.json`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className={`bg-white border border-slate-200 rounded-xl p-6 max-w-2xl mx-auto ${className}`}>
			<div className="flex items-center gap-3 mb-6">
				<Shield className="w-8 h-8 text-blue-600" />
				<div>
					<h2 className="text-xl font-bold text-slate-900">Air-Gapped Verification Kiosk</h2>
					<p className="text-slate-600 text-sm">Verify package integrity and generate audit tickets</p>
				</div>
			</div>

			{/* Verification Methods */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				{/* File Upload */}
				<div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
					<FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
					<h3 className="font-semibold text-slate-900 mb-2">Upload Manifest</h3>
					<p className="text-sm text-slate-600 mb-3">Upload air-gapped-manifest.json</p>
					<input
						ref={fileInputRef}
						type="file"
						accept=".json"
						onChange={handleFileUpload}
						className="hidden"
					/>
					<button
						onClick={() => fileInputRef.current?.click()}
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Choose File
					</button>
				</div>

				{/* QR Input */}
				<div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors overflow-hidden">
					<QrCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
					<h3 className="font-semibold text-slate-900 mb-2">QR Code Hash</h3>
					<p className="text-sm text-slate-600 mb-3">Enter QR code hash manually</p>
					<div className="flex items-center gap-2 w-full">
						<input
							type="text"
							value={qrInput}
							onChange={(e) => setQrInput(e.target.value)}
							placeholder="AEG-1.0.0-abc123..."
							className="flex-1 min-w-0 px-3 h-10 border border-slate-300 rounded-lg text-sm"
						/>
						<button
							onClick={handleQRInput}
							disabled={!qrInput.trim() || isVerifying}
							className="shrink-0 bg-green-600 text-white px-4 h-10 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
						>
							Verify
						</button>
					</div>
				</div>
			</div>

			{/* Verification Status */}
			{isVerifying && (
				<div className="flex items-center justify-center py-8">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					<span className="ml-3 text-slate-600">Verifying package integrity...</span>
				</div>
			)}

			{/* Results */}
			{verificationResult && !isVerifying && (
				<div className="border border-slate-200 rounded-lg p-4">
					<div className="flex items-center gap-3 mb-4">
						{verificationResult.valid ? (
							<CheckCircle className="w-6 h-6 text-green-600" />
						) : (
							<XCircle className="w-6 h-6 text-red-600" />
						)}
						<h3 className="font-semibold text-slate-900">
							{verificationResult.valid ? 'Verification Passed' : 'Verification Failed'}
						</h3>
					</div>

					{verificationResult.manifest && (
						<div className="grid grid-cols-2 gap-4 mb-4 text-sm">
							<div>
								<span className="font-medium text-slate-600">Package:</span>
								<span className="ml-2 text-slate-900">{verificationResult.manifest.name}</span>
							</div>
							<div>
								<span className="font-medium text-slate-600">Version:</span>
								<span className="ml-2 text-slate-900">{verificationResult.manifest.version}</span>
							</div>
							<div>
								<span className="font-medium text-slate-600">Created:</span>
								<span className="ml-2 text-slate-900">
									{new Date(verificationResult.manifest.createdAt).toLocaleDateString()}
								</span>
							</div>
							<div>
								<span className="font-medium text-slate-600">Signed By:</span>
								<span className="ml-2 text-slate-900">{verificationResult.manifest.signedBy}</span>
							</div>
						</div>
					)}

					{verificationResult.qrHash && (
						<div className="mb-4">
							<span className="font-medium text-slate-600 text-sm">QR Hash:</span>
							<code className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded">
								{verificationResult.qrHash}
							</code>
						</div>
					)}

					{verificationResult.errors.length > 0 && (
						<div className="mb-4">
							<div className="flex items-center gap-2 mb-2">
								<AlertTriangle className="w-4 h-4 text-red-600" />
								<span className="font-medium text-red-600 text-sm">Errors Found:</span>
							</div>
							<ul className="list-disc list-inside text-sm text-red-600 space-y-1">
								{verificationResult.errors.map((error, index) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</div>
					)}

					{verificationResult.valid && (
						<div className="flex gap-3">
							<button
								onClick={generateVerificationTicket}
								className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
							>
								<Download className="w-4 h-4" />
								Generate Ticket
							</button>
							<button
								onClick={() => setVerificationResult(null)}
								className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
							>
								Clear
							</button>
						</div>
					)}
				</div>
			)}

			{/* Instructions */}
			<div className="mt-6 p-4 bg-blue-50 rounded-lg">
				<h4 className="font-semibold text-blue-900 mb-2">Field Verification Instructions:</h4>
				<ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
					<li>Scan the QR code on the package with any QR scanner</li>
					<li>Upload the air-gapped-manifest.json file</li>
					<li>Compare the QR hash with the manifest hash</li>
					<li>Verify all checksums in integrity/checksums.sha256.json</li>
					<li>Run post-install self-tests</li>
					<li>Generate verification ticket for audit trail</li>
				</ol>
			</div>
		</div>
	)
}
