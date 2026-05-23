/**
 * Authentes 2.0 API Service
 * Handles communication with the Python backend
 */

export interface ValidationRequest {
  data_type: string;
  sample_size: number;
  privacy_level: number;
  target_accuracy: number;
  use_real_data: boolean;
}

export interface ValidationResponse {
  request_id: string;
  accuracy: number;
  realism_score: number;
  privacy_score: number;
  processing_time: number;
  model_ensemble_results: Record<string, number>;
  triad_scores: Record<string, number>;
  pis2_scores: Record<string, number>;
  hre_synchronization: number;
  timestamp: string;
}

export interface BenchmarkResult {
  system_name: string;
  accuracy: number;
  real_data_usage: number;
  processing_time: number;
  privacy_score: number;
  ks_test_pvalue: number;
  kl_divergence: number;
  harmonic_loss: number;
  memory_usage: number;
  cpu_usage: number;
  timestamp: string;
}

export interface BenchmarkSummary {
  results: BenchmarkResult[];
  summary: {
    accuracy_improvement: Record<string, number>;
    privacy_improvement: Record<string, number>;
    efficiency_metrics: Record<string, Record<string, number>>;
    statistical_quality: Record<string, number>;
  };
  timestamp: string;
  // Additional properties expected by ModuleBenchmarks
  accuracy?: number;
  cost_reduction?: number;
  modules?: Array<{ name: string; contribution: number }>;
  privacy?: Record<string, { 
    auc?: number; 
    attack_accuracy?: number; 
    risk?: number; 
    leakage_score?: number; 
    description?: string 
  }>;
  sdgym?: {
    synthetic_score?: number;
    real_score?: number;
    description?: string;
  };
  privacyraven?: {
    attack_success_rate?: number;
    description?: string;
  };
}

class AuthentesApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Validate synthetic data generation
   */
  async validateData(request: ValidationRequest): Promise<ValidationResponse> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Validation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Run comprehensive benchmarks
   */
  async runBenchmarks(): Promise<BenchmarkSummary> {
    const response = await fetch(`${this.baseUrl}/benchmark`);

    if (!response.ok) {
      throw new Error(`Benchmark failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get system health status
   */
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/`);

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Run privacy benchmark with different ε values
   */
  async runPrivacyBenchmark(): Promise<{
    privacy_benchmark: Array<{
      epsilon: number;
      privacy_score: number;
      accuracy: number;
      noise_scale: number;
    }>;
    timestamp: string;
  }> {
    // This would be a separate endpoint in the real implementation
    const response = await fetch(`${this.baseUrl}/privacy-benchmark`);

    if (!response.ok) {
      throw new Error(`Privacy benchmark failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Run scalability benchmark
   */
  async runScalabilityBenchmark(): Promise<{
    scalability_benchmark: Array<{
      data_size: number;
      processing_time: number;
      throughput: number;
      memory_usage: number;
    }>;
    timestamp: string;
  }> {
    // This would be a separate endpoint in the real implementation
    const response = await fetch(`${this.baseUrl}/scalability-benchmark`);

    if (!response.ok) {
      throw new Error(`Scalability benchmark failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const authentesApi = new AuthentesApiService();

// Export types for use in components
export type { ValidationRequest, ValidationResponse, BenchmarkResult, BenchmarkSummary }; 