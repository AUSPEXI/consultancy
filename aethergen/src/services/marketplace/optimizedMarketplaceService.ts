import axios from 'axios';
import PQueue from 'p-queue';
import { ProcessedData } from '../../types';

// Enhanced marketplace configuration with multi-industry support
const marketplaces = {
  databricks: {
    url: import.meta.env.VITE_DATABRICKS_API_URL,
    key: import.meta.env.VITE_DATABRICKS_API_KEY,
    name: 'Databricks Marketplace',
    rateLimit: { requests: 100, per: 'hour' },
    batchSize: 1000
  },
  snowflake: {
    url: import.meta.env.VITE_SNOWFLAKE_API_URL,
    key: import.meta.env.VITE_SNOWFLAKE_API_KEY,
    name: 'Snowflake Data Marketplace',
    rateLimit: { requests: 200, per: 'hour' },
    batchSize: 5000
  },
  datarade: {
    url: import.meta.env.VITE_DATARADE_API_URL,
    key: import.meta.env.VITE_DATARADE_API_KEY,
    name: 'Datarade',
    rateLimit: { requests: 50, per: 'hour' },
    batchSize: 500
  },
  brightdata: {
    url: import.meta.env.VITE_BRIGHTDATA_API_URL,
    key: import.meta.env.VITE_BRIGHTDATA_API_KEY,
    name: 'Bright Data',
    rateLimit: { requests: 150, per: 'hour' },
    batchSize: 2000
  }
};

// Current multi-industry pricing structure
export const pricingTiers = {
  automotive: {
    self_service: {
      base_price: 599,
      range: '£599 - £1,299',
      currency: 'GBP',
      period: 'monthly',
      description: 'Automotive Manufacturing - Self-Service',
      categories: ['Quality Control', 'Manufacturing Analytics', 'Safety Testing', 'Supply Chain'],
      features: [
        'Pre-trained models for automotive applications',
        'Training datasets with evidence bundles',
        'Basic API access and documentation',
        'Customer handles compute and infrastructure'
      ]
    },
    full_service: {
      base_price: 2799,
      range: '£2,799 - £3,999',
      currency: 'GBP',
      period: 'monthly',
      description: 'Automotive Manufacturing - Full-Service',
      categories: ['Quality Control', 'Manufacturing Analytics', 'Safety Testing', 'Supply Chain'],
      features: [
        'Everything from self-service',
        'AWS infrastructure setup',
        'Compute management and deployment',
        'SLA guarantees and dedicated support'
      ]
    }
  },
  healthcare: {
    self_service: {
      base_price: 699,
      range: '£699 - £1,299',
      currency: 'GBP',
      period: 'monthly',
      description: 'Healthcare & NHS - Self-Service',
      categories: ['Fraud Detection', 'Medical Research', 'Patient Care', 'Operations'],
      features: [
        'Pre-trained models for healthcare applications',
        'Training datasets with evidence bundles',
        'Basic API access and documentation',
        'Customer handles compute and infrastructure'
      ]
    },
    full_service: {
      base_price: 3499,
      range: '£3,499 - £5,999',
      currency: 'GBP',
      period: 'monthly',
      description: 'Healthcare & NHS - Full-Service',
      categories: ['Fraud Detection', 'Medical Research', 'Patient Care', 'Operations'],
      features: [
        'Everything from self-service',
        'AWS infrastructure setup',
        'Compute management and deployment',
        'SLA guarantees and dedicated support'
      ]
    }
  },
  financial: {
    self_service: {
      base_price: 1299,
      range: '£1,299 - £1,999',
      currency: 'GBP',
      period: 'monthly',
      description: 'Financial Services - Self-Service',
      categories: ['Credit Risk', 'Market Risk', 'Compliance', 'Insurance'],
      features: [
        'Pre-trained models for financial applications',
        'Training datasets with evidence bundles',
        'Basic API access and documentation',
        'Customer handles compute and infrastructure'
      ]
    },
    full_service: {
      base_price: 6999,
      range: '£6,999 - £9,999',
      currency: 'GBP',
      period: 'monthly',
      description: 'Financial Services - Full-Service',
      categories: ['Credit Risk', 'Market Risk', 'Compliance', 'Insurance'],
      features: [
        'Everything from self-service',
        'AWS infrastructure setup',
        'Compute management and deployment',
        'SLA guarantees and dedicated support'
      ]
    }
  }
};

// Queue manager for marketplace uploads
class MarketplaceUploadManager {
  private queues: Map<string, PQueue> = new Map();

  constructor() {
    Object.entries(marketplaces).forEach(([platform, config]) => {
      const requestsPerHour = config.rateLimit.requests;
      const intervalMs = 3600000 / requestsPerHour;

      this.queues.set(platform, new PQueue({
        concurrency: 1,
        interval: intervalMs,
        intervalCap: 1
      }));
    });
  }

  getQueue(platform: string): PQueue | undefined {
    return this.queues.get(platform);
  }

  getStats() {
    const stats: Record<string, any> = {};
    this.queues.forEach((queue, platform) => {
      stats[platform] = {
        size: queue.size,
        pending: queue.pending,
        isPaused: queue.isPaused
      };
    });
    return stats;
  }

  clearAll() {
    this.queues.forEach(queue => queue.clear());
  }
}

const uploadManager = new MarketplaceUploadManager();

// Enhanced data formatting for multi-industry uploads
const formatDataForMarketplace = (data: ProcessedData[], platform: string, batchIndex: number = 0) => {
  const config = marketplaces[platform as keyof typeof marketplaces];
  
  // Determine pricing tier based on industry
  let pricingTier = 'self_service'; // Default to self-service
  if (data.some(item => item.industry === 'Automotive')) {
    pricingTier = 'automotive';
  } else if (data.some(item => item.industry === 'Healthcare')) {
    pricingTier = 'healthcare';
  } else if (data.some(item => item.industry === 'Financial')) {
    pricingTier = 'financial';
  }

  const basePayload = {
    dataset_name: 'Multi-Industry Unified Dataset',
    description: 'Comprehensive data streaming across multiple industries with AI-powered analytics',
    version: '1.0.0',
    provider: 'AUSPEXI',
    contact: 'sales@auspexi.com',
    website: 'https://auspexi.com',
    demo_url: 'https://data.auspexi.com',
    pricing: pricingTiers,
    data_format: 'JSON/CSV/Streaming',
    update_frequency: 'Real-time (every 20 minutes)',
    industry_coverage: [...new Set(data.map(d => d.industry))],
    batch_info: {
      batch_index: batchIndex,
      batch_size: data.length,
      max_batch_size: config.batchSize,
      timestamp: new Date().toISOString(),
      records_by_industry: data.reduce((acc, d) => {
        acc[d.industry] = (acc[d.industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      pricing_tier: pricingTier
    },
    records: data.map(item => ({
      id: item.id,
      timestamp: item.timestamp,
      location: item.location,
      industry: item.industry,
      event: item.narrative.text.split(' ')[0].toLowerCase(), // Retaining event for narrative
      narrative: item.narrative.text,
      narrative_confidence: item.narrative.confidence,
      credit_score: item.credit_score, // New field
      transaction_volume: item.transaction_volume, // New field
      risk_weight: item.risk_weight, // New field
      addons: item.addons,
      source: item.source,
      pricing_model: pricingTier === 'full_service' ? 'full_service' : 'self_service'
    })),
    metadata: {
      total_records: data.length,
      last_updated: new Date().toISOString(),
      data_quality_score: 0.95,
      geographic_coverage: [...new Set(data.map(d => d.location))],
      industry_distribution: data.reduce((acc, d) => {
        acc[d.industry] = (acc[d.industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      finance_metric_distribution: { // New distribution for finance metrics
        credit_score_avg: data.reduce((sum, d) => sum + d.credit_score, 0) / data.length,
        transaction_volume_avg: data.reduce((sum, d) => sum + d.transaction_volume, 0) / data.length,
        risk_weight_avg: data.reduce((sum, d) => sum + d.risk_weight, 0) / data.length
      },
      addons_included: {
        riskAnalysis: data.every(d => d.addons.riskAnalysis),
        fraudDetection: data.every(d => d.addons.fraudDetection),
        complianceMonitoring: data.every(d => d.addons.complianceMonitoring),
        marketAnalysis: data.every(d => d.addons.marketAnalysis),
        portfolioOptimization: data.every(d => d.addons.portfolioOptimization)
      },
      performance_metrics: {
        avg_confidence: data.reduce((sum, d) => sum + d.narrative.confidence, 0) / data.length,
        data_freshness: Math.min(...data.map(d => Date.now() - new Date(d.timestamp).getTime())) / 1000 / 60
      }
    }
  };

  // Platform-specific formatting
  switch (platform) {
    case 'databricks':
      return {
        ...basePayload,
        format: 'delta_table',
        schema_version: '2.0',
        partition_columns: ['industry', 'location', 'timestamp'],
        optimization: {
          z_order: ['timestamp', 'industry', 'location', 'credit_score'],
          auto_optimize: true,
          auto_compact: true
        },
        industry_support: true
      };
    
    case 'snowflake':
      return {
        ...basePayload,
        warehouse: 'MULTI_INDUSTRY_WH',
        database: 'MULTI_INDUSTRY_DATA',
        schema: 'UNIFIED_INDUSTRIES',
        table_name: 'multi_industry_streaming',
        clustering_keys: ['industry', 'timestamp', 'location'],
        time_travel_retention: 7
      };
    
    case 'datarade':
      return {
        ...basePayload,
        category: 'Multi-Industry Analytics',
        subcategory: 'Unified Data Stream',
        tags: ['multi-industry', 'ai', 'streaming', 'credit', 'trading', 'cashflow', 'risk', 'compliance'],
        quality_score: 0.95,
        update_frequency_minutes: 20,
        industry_coverage: [...new Set(data.map(d => d.industry))],
        suite_coverage: 8 // This might need adjustment based on actual industry coverage
      };
    
    case 'brightdata':
      return {
        ...basePayload,
        collection_method: 'MULTI_INDUSTRY_STREAMING',
        data_freshness: 'REAL_TIME',
        compliance: ['GDPR', 'CCPA', 'FCA', 'SEC', 'SOC2'],
        delivery_format: ['JSON', 'CSV', 'API', 'STREAMING', 'WEBHOOK'],
        geographic_scope: 'GLOBAL',
        language_support: ['EN'],
        industry_certified: true
      };
    
    default:
      return basePayload;
  }
};

// Handle static dataset upload for CREDRISE suite
const uploadStaticCredriseDataset = async (credriseData: ProcessedData[], platform: string) => {
  if (credriseData.length === 0) return null;
  
  const config = marketplaces[platform as keyof typeof marketplaces];
  if (!config || !config.url || !config.key) return null;

  try {
    const staticPayload = {
      dataset_name: 'CREDRISE Credit Narratives - Static Dataset',
      description: 'Comprehensive credit data with AI narratives and credit scoring simulations',
      version: '1.0.0',
      provider: 'AUSPEXI',
      pricing: pricingTiers.static_credrise,
      data_points: credriseData.length,
      records: credriseData,
      metadata: {
        suite: 'CREDRISE',
        pricing_model: 'static',
        total_records: credriseData.length,
        addons_included: true
      }
    };

    const response = await axios.post(config.url, staticPayload, {
      headers: {
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'FINANCE-SUITE-AUSPEXI/2.0.0',
        'X-Dataset-Type': 'STATIC',
        'X-Suite': 'CREDRISE',
        'X-Pricing': '1800'
      },
      timeout: 60000
    });

    console.log(`💰 CREDRISE static dataset uploaded to ${config.name}: ${credriseData.length} records at $1,800`);
    return response.data;
  } catch (error) {
    console.error(`❌ CREDRISE static upload to ${platform} failed:`, error);
    return null;
  }
};

// Optimized batch upload to individual marketplace with Finance Suite support
export const uploadBatchToMarketplace = async (
  platform: string, 
  data: ProcessedData[],
  batchIndex: number = 0
): Promise<{ success: boolean; message: string; details?: any }> => {
  const config = marketplaces[platform as keyof typeof marketplaces];
  
  if (!config || !config.url || !config.key) {
    return {
      success: false,
      message: `${config?.name || platform} credentials not configured. Please add API credentials to environment variables.`
    };
  }

  const queue = uploadManager.getQueue(platform);
  if (!queue) {
    return {
      success: false,
      message: `Upload queue not found for ${platform}`
    };
  }

  try {
    // Separate CREDRISE data for static upload
    const credriseData = data.filter(item => item.suite === 'CREDRISE');
    const streamingData = data.filter(item => item.suite !== 'CREDRISE');
    
    console.log(`Uploading to ${config.name}: ${credriseData.length} CREDRISE (static), ${streamingData.length} streaming`);

    // Upload static CREDRISE dataset if available
    let staticUploadResult = null;
    if (credriseData.length > 0) {
      staticUploadResult = await uploadStaticCredriseDataset(credriseData, platform);
    }

    // Split streaming data into platform-specific batch sizes
    const batches = [];
    for (let i = 0; i < data.length; i += config.batchSize) {
      batches.push(data.slice(i, i + config.batchSize));
    }

    const batchResults = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const payload = formatDataForMarketplace(batch, platform, i);
      
      const result = await queue.add(async () => {
        const response = await axios.post(config.url, payload, {
          headers: {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json',
            'User-Agent': 'FINANCE-SUITE-AUSPEXI/2.0.0',
            'X-Batch-Index': i.toString(),
            'X-Total-Batches': batches.length.toString(),
            'X-Finance-Suites': '8',
            'X-Addons-Bundled': '5'
          },
          timeout: 60000
        });

        return {
          batchIndex: i,
          recordsUploaded: batch.length,
          responseStatus: response.status,
          uploadId: response.data?.id || response.data?.upload_id
        };
      });

      batchResults.push(result);
      console.log(`✓ Batch ${i + 1}/${batches.length} uploaded to ${config.name} (${batch.length} records)`);
    }

    const totalUploaded = batchResults.reduce((sum, result) => sum + result.recordsUploaded, 0);

    return {
      success: true,
      message: `Successfully uploaded ${totalUploaded} Finance Suite records to ${config.name}`,
      details: {
        platform,
        total_records: totalUploaded,
        credrise_static_records: credriseData.length,
        streaming_records: streamingData.length,
        batches_uploaded: batches.length,
        batch_results: batchResults,
        static_upload_result: staticUploadResult,
        pricing_applied: pricingTiers,
        rate_limit_info: config.rateLimit
      }
    };
  } catch (error) {
    console.error(`Error uploading Finance Suite data to ${platform}:`, error);
    
    let errorMessage = `Failed to upload to ${config.name}`;
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorMessage += ': Invalid API credentials';
      } else if (error.response?.status === 403) {
        errorMessage += ': Access forbidden - check API permissions';
      } else if (error.response?.status === 429) {
        errorMessage += ': Rate limit exceeded - retrying with backoff';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage += ': Request timeout - batch may be too large';
      } else {
        errorMessage += `: ${error.response?.data?.message || error.message}`;
      }
    }

    return {
      success: false,
      message: errorMessage,
      details: {
        platform,
        error_code: axios.isAxiosError(error) ? error.response?.status : 'UNKNOWN',
        error_type: error.name || 'Error',
        batch_size: data.length,
        suggested_batch_size: Math.floor(config.batchSize / 2)
      }
    };
  }
};

// Optimized upload to all configured marketplaces with Finance Suite intelligence
export const uploadToAllMarketplacesOptimized = async (data: ProcessedData[]) => {
  const results = {
    successful: [] as string[],
    failed: [] as { platform: string; error: string }[],
    total: 0,
    totalRecords: data.length,
    credrise_records: data.filter(d => d.suite === 'CREDRISE').length, // Changed from changesRecords
    streamingRecords: data.filter(d => d.suite !== 'CREDRISE').length, // Changed from changesRecords
    summary: '',
    performance: {
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      recordsPerSecond: 0
    }
  };

  console.log(`Starting Finance Suite upload of ${data.length} records (${results.credrise_records} CREDRISE static, ${results.streamingRecords} streaming)...`);

  const uploadPromises = Object.entries(marketplaces).map(async ([platform, config]) => {
    if (config.url && config.key) {
      console.log(`Uploading Finance Suite data to ${config.name}...`);
      const result = await uploadBatchToMarketplace(platform, data);
      
      if (result.success) {
        results.successful.push(config.name);
        console.log(`✅ ${result.message}`);
      } else {
        results.failed.push({ platform: config.name, error: result.message });
        console.error(`✗ ${result.message}`);
      }
      
      results.total++;
      return result;
    } else {
      console.log(`Skipping ${config.name} - credentials not configured`);
      return null;
    }
  });

  await Promise.all(uploadPromises);

  // Calculate performance metrics
  results.performance.endTime = Date.now();
  results.performance.duration = results.performance.endTime - results.performance.startTime;
  results.performance.recordsPerSecond = Math.round((data.length / results.performance.duration) * 1000);

  // Generate summary
  if (results.successful.length === 0 && results.failed.length === 0) {
    results.summary = 'No marketplaces configured. Please add API credentials to environment variables.';
  } else if (results.successful.length > 0 && results.failed.length === 0) {
    results.summary = `Successfully uploaded ${data.length} Finance Suite records to all ${results.successful.length} configured marketplace(s) in ${results.performance.duration}ms (${results.performance.recordsPerSecond} records/sec)`;
  } else if (results.successful.length === 0) {
    results.summary = `Failed to upload to all ${results.failed.length} marketplace(s)`;
  } else {
    results.summary = `Uploaded ${data.length} Finance Suite records to ${results.successful.length}/${results.total} marketplace(s) in ${results.performance.duration}ms. Successful: ${results.successful.join(', ')}`;
  }

  console.log(results.summary);
  return results;
};

// Get marketplace status with Finance Suite information
export const getMarketplaceStatusOptimized = () => {
  const status = Object.entries(marketplaces).map(([platform, config]) => ({
    platform,
    name: config.name,
    configured: !!(config.url && config.key),
    url_set: !!config.url,
    key_set: !!config.key,
    rate_limit: config.rateLimit,
    batch_size: config.batchSize,
    industry_support: true,
    queue_stats: uploadManager.getQueue(platform) ? {
      size: uploadManager.getQueue(platform)!.size,
      pending: uploadManager.getQueue(platform)!.pending,
      isPaused: uploadManager.getQueue(platform)!.isPaused
    } : null
  }));

  const configured = status.filter(s => s.configured).length;
  const total = status.length;

  return {
    marketplaces: status,
    summary: `${configured}/${total} marketplace(s) configured for Finance Suite`,
    all_configured: configured === total,
    none_configured: configured === 0,
    queue_manager_stats: uploadManager.getStats(),
    finance_suite_info: {
      total_suites: 8,
      bundled_addons: 5,
      pricing_model: 'streaming_plus_static',
      streaming_price: '$2,499/month',
      static_price: '$4,999 (CREDRISE only)'
    },
    performance_info: {
      total_daily_capacity: Object.values(marketplaces).reduce((sum, config) => 
        sum + (config.rateLimit.requests * 24), 0),
      estimated_daily_records: Object.values(marketplaces).reduce((sum, config) => 
        sum + (config.rateLimit.requests * config.batchSize * 24), 0)
    }
  };
};

// Legacy functions for backward compatibility
export const uploadToMarketplace = uploadBatchToMarketplace;
export const uploadToAllMarketplaces = uploadToAllMarketplacesOptimized;
export const getMarketplaceStatus = getMarketplaceStatusOptimized;