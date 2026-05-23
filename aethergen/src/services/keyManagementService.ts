import JSZip from 'jszip'
import { generateAirGappedBundle, AirGappedOptions } from './edgePackagingService'

export interface KeyPair {
	id: string
	name: string
	publicKey: string
	privateKey?: string // Only available during creation
	createdAt: string
	expiresAt?: string
	permissions: string[]
	algorithm?: string
	status: 'active' | 'expired' | 'revoked'
}

export interface SigningRequest {
	id: string
	manifestHash: string
	requestedBy: string
	requestedAt: string
	approvedBy?: string
	approvedAt?: string
	rejectedBy?: string
	rejectedAt?: string
	reason?: string
	status: 'pending' | 'approved' | 'rejected'
}

export interface KeyVault {
	id: string
	name: string
	description: string
	keys: KeyPair[]
	createdAt: string
	lastAccessed: string
	accessLog: Array<{
		timestamp: string
		action: string
		user: string
		ip?: string
	}>
}

class KeyManagementService {
	private keyVaults: Map<string, KeyVault> = new Map()
	private signingRequests: Map<string, SigningRequest> = new Map()

	// Generate a new key pair for air-gapped signing
	async generateKeyPair(name: string, permissions: string[] = ['sign']): Promise<KeyPair> {
		const id = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		// Read preferred signature algorithm from env (demo default)
		const envSigAlgo = ((import.meta as any)?.env?.VITE_SIG_ALGO) as string | undefined
		const algorithm = (envSigAlgo && String(envSigAlgo)) || 'demo-ecdsa'

		// Generate a simple key pair (in production, use proper cryptographic libraries)
		const publicKey = `aeg-public-${id}`
		const privateKey = `aeg-private-${id}-${Math.random().toString(36).substr(2, 16)}`
		
		const keyPair: KeyPair = {
			id,
			name,
			publicKey,
			privateKey,
			createdAt: new Date().toISOString(),
			expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
			permissions,
			algorithm,
			status: 'active'
		}

		return keyPair
	}

	// Create a new key vault for offline storage
	async createKeyVault(name: string, description: string): Promise<KeyVault> {
		const id = `vault-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		
		const vault: KeyVault = {
			id,
			name,
			description,
			keys: [],
			createdAt: new Date().toISOString(),
			lastAccessed: new Date().toISOString(),
			accessLog: []
		}

		this.keyVaults.set(id, vault)
		return vault
	}

	// Add a key to a vault
	async addKeyToVault(vaultId: string, keyPair: KeyPair): Promise<void> {
		const vault = this.keyVaults.get(vaultId)
		if (!vault) {
			throw new Error('Key vault not found')
		}

		// Remove private key for storage (security best practice)
		const { privateKey, ...storedKey } = keyPair
		vault.keys.push(storedKey)
		vault.lastAccessed = new Date().toISOString()
		vault.accessLog.push({
			timestamp: new Date().toISOString(),
			action: 'key_added',
			user: 'system'
		})
	}

	// Create a signing request for dual-control
	async createSigningRequest(manifestHash: string, requestedBy: string): Promise<SigningRequest> {
		const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		
		const request: SigningRequest = {
			id,
			manifestHash,
			requestedBy,
			requestedAt: new Date().toISOString(),
			status: 'pending'
		}

		this.signingRequests.set(id, request)
		return request
	}

	// Approve a signing request
	async approveSigningRequest(requestId: string, approvedBy: string): Promise<SigningRequest> {
		const request = this.signingRequests.get(requestId)
		if (!request) {
			throw new Error('Signing request not found')
		}

		if (request.status !== 'pending') {
			throw new Error('Request is not pending')
		}

		request.approvedBy = approvedBy
		request.approvedAt = new Date().toISOString()
		request.status = 'approved'

		return request
	}

	// Reject a signing request
	async rejectSigningRequest(requestId: string, rejectedBy: string, reason: string): Promise<SigningRequest> {
		const request = this.signingRequests.get(requestId)
		if (!request) {
			throw new Error('Signing request not found')
		}

		if (request.status !== 'pending') {
			throw new Error('Request is not pending')
		}

		request.rejectedBy = rejectedBy
		request.rejectedAt = new Date().toISOString()
		request.reason = reason
		request.status = 'rejected'

		return request
	}

	// Sign a manifest with dual-control approval
	async signManifestWithApproval(
		manifestHash: string, 
		keyPair: KeyPair, 
		approver: string
	): Promise<string> {
		// Create signing request
		const request = await this.createSigningRequest(manifestHash, 'system')
		
		// Auto-approve for demo (in production, this would require manual approval)
		await this.approveSigningRequest(request.id, approver)
		
		// Generate signature
		const signature = `aeg-sig-${manifestHash}-${keyPair.id}-${Date.now()}`
		
		return signature
	}

	// Export key vault for offline storage
	async exportKeyVault(vaultId: string): Promise<Blob> {
		const vault = this.keyVaults.get(vaultId)
		if (!vault) {
			throw new Error('Key vault not found')
		}

		const exportData = {
			vault: {
				id: vault.id,
				name: vault.name,
				description: vault.description,
				createdAt: vault.createdAt,
				exportedAt: new Date().toISOString()
			},
			keys: vault.keys,
			accessLog: vault.accessLog
		}

		const jsonString = JSON.stringify(exportData, null, 2)
		return new Blob([jsonString], { type: 'application/json' })
	}

	// Import key vault from offline storage
	async importKeyVault(exportData: string): Promise<KeyVault> {
		try {
			const data = JSON.parse(exportData)
			const vault: KeyVault = {
				id: data.vault.id,
				name: data.vault.name,
				description: data.vault.description,
				keys: data.keys || [],
				createdAt: data.vault.createdAt,
				lastAccessed: new Date().toISOString(),
				accessLog: data.accessLog || []
			}

			this.keyVaults.set(vault.id, vault)
			return vault
		} catch (error) {
			throw new Error('Invalid key vault export format')
		}
	}

	// Get all key vaults
	async getKeyVaults(): Promise<KeyVault[]> {
		return Array.from(this.keyVaults.values())
	}

	// Get all signing requests
	async getSigningRequests(): Promise<SigningRequest[]> {
		return Array.from(this.signingRequests.values())
	}

	// Revoke a key
	async revokeKey(vaultId: string, keyId: string): Promise<void> {
		const vault = this.keyVaults.get(vaultId)
		if (!vault) {
			throw new Error('Key vault not found')
		}

		const key = vault.keys.find(k => k.id === keyId)
		if (!key) {
			throw new Error('Key not found')
		}

		key.status = 'revoked'
		vault.lastAccessed = new Date().toISOString()
		vault.accessLog.push({
			timestamp: new Date().toISOString(),
			action: 'key_revoked',
			user: 'system'
		})
	}
}

// Export singleton instance
export const keyManagementService = new KeyManagementService()

// Enhanced air-gapped bundle generation with dual-control signing
export async function generateAirGappedBundleWithDualControl(
	options: AirGappedOptions,
	keyVaultId: string,
	approver: string
): Promise<Blob> {
	// Generate the base bundle
	const bundle = await generateAirGappedBundle(options)
	
	// Get the manifest from the bundle
	const zip = new JSZip()
	await zip.loadAsync(bundle)
	const manifestFile = zip.file('air-gapped-manifest.json')
	
	if (!manifestFile) {
		throw new Error('Manifest not found in bundle')
	}
	
	const manifestText = await manifestFile.async('text')
	const manifest = JSON.parse(manifestText)
	
	// Generate a key pair for signing
	const keyPair = await keyManagementService.generateKeyPair('air-gapped-signing-key')
	
	// Sign the manifest with dual-control approval
	const signature = await keyManagementService.signManifestWithApproval(
		manifest.manifestHash,
		keyPair,
		approver
	)
	
	// Add the signature to the bundle
	zip.file('integrity/signature.txt', `Signed by: ${keyPair.name}\nSignature: ${signature}\nApproved by: ${approver}\nApproved at: ${new Date().toISOString()}`)
	
	// Add key information (public key only)
	zip.file('integrity/signing-key.json', JSON.stringify({
		keyId: keyPair.id,
		keyName: keyPair.name,
		publicKey: keyPair.publicKey,
		createdAt: keyPair.createdAt,
		expiresAt: keyPair.expiresAt,
		permissions: keyPair.permissions
	}, null, 2))
	
	// Add the key to the vault
	await keyManagementService.addKeyToVault(keyVaultId, keyPair)
	
	return await zip.generateAsync({ type: 'blob' })
}
