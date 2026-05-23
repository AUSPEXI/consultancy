import React, { useState } from 'react'
import { Download, QrCode, Shield, CheckCircle, FileText, Package } from 'lucide-react'
import JSZip from 'jszip'
import { generateAirGappedBundle, AirGappedOptions } from '../services/edgePackagingService'
import { VerificationKiosk } from '../components/VerificationKiosk'
import { platformApi } from '../services/platformApi'

export const AirGappedDemo: React.FC = () => {
  const [generationStatus, setGenerationStatus] = useState<string>('')
  const [bundleInfo, setBundleInfo] = useState<any>(null)

  const demoOptions: AirGappedOptions = {
    projectName: 'demo-model-v1.0',
    version: '1.0.0',
    deviceInfo: { vramGB: 8, int8: true, fp16: true },
    evidenceBundle: { lineage: 'Demo generation' }
  }

  const handleGenerateBundle = async () => {
    setGenerationStatus('Generating air-gapped bundle...')
    
    try {
      const blob = await generateAirGappedBundle(demoOptions)
      setBundleInfo({ blob, size: blob.size, hasManifest: true, hasQRCode: true })
      setGenerationStatus('Bundle generated successfully!')

      // Live mode: log packaging summary to MLflow via Netlify
      if (platformApi.isLive()) {
        try {
          await platformApi.logMlflow({
            summary: {
              packaging_size_bytes: blob.size,
              has_manifest: 1,
              has_qr: 1,
              device_vram_gb: demoOptions.deviceInfo.vramGB
            }
          })
        } catch {}
      }
    } catch (error) {
      setGenerationStatus(`Error: ${error}`)
    }
  }

  const handleDownloadBundle = () => {
    if (bundleInfo?.blob) {
      const url = URL.createObjectURL(bundleInfo.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `air-gapped-bundle-${demoOptions.modelId}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Air-Gapped AI Packaging Demo
          </h1>
          <p className="text-xl text-gray-600">
            Generate secure, air-gapped edge bundles with manifests, QR codes, and SOPs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <Package className="mr-2 text-blue-600" />
              Bundle Generation
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Demo Configuration:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Project: {demoOptions.projectName}</li>
                  <li>• Version: {demoOptions.version}</li>
                  <li>• Device VRAM: {demoOptions.deviceInfo.vramGB}GB</li>
                  <li>• INT8: {demoOptions.deviceInfo.int8 ? 'Yes' : 'No'} | FP16: {demoOptions.deviceInfo.fp16 ? 'Yes' : 'No'}</li>
                </ul>
              </div>

              <button
                onClick={handleGenerateBundle}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Download className="mr-2" />
                Generate Air-Gapped Bundle
              </button>

              {generationStatus && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800">{generationStatus}</p>
                </div>
              )}

              {bundleInfo && (
                <div className="space-y-3">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Bundle Generated:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Size: {bundleInfo.size} bytes</li>
                      {bundleInfo.fileCount !== undefined && (
                        <li>• Files: {bundleInfo.fileCount}</li>
                      )}
                      <li>• Manifest: {bundleInfo.hasManifest ? 'Included' : 'Not included'}</li>
                      <li>• QR Code: {bundleInfo.hasQRCode ? 'Included' : 'Not included'}</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleDownloadBundle}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Download className="mr-2" />
                    Download Bundle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Verification Kiosk */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
              <Shield className="mr-2 text-green-600" />
              Field Verification Kiosk
            </h2>
            <VerificationKiosk />
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Air-Gapped AI Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">QR Verification</h3>
              <p className="text-sm text-gray-600">Quick verification with QR codes for field deployment</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Secure Packaging</h3>
              <p className="text-sm text-gray-600">Signed manifests and SBOMs for complete security</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Field SOPs</h3>
              <p className="text-sm text-gray-600">Standard operating procedures for field engineers</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Dual Control</h3>
              <p className="text-sm text-gray-600">Two-person authorization for critical deployments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
