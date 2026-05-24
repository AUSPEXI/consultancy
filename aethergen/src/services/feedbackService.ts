import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface FeedbackData {
  suite: string;
  field: string;
  action: string;
  params: Record<string, any>;
  description: string;
  client_id?: string;
  zk_proof?: string;
}

export interface ValidationMetrics {
  ks_test_p_value: number;
  kl_divergence: number;
  statistical_distance: number;
  quality_score: number;
}

/**
 * Submit feedback for SDSP platform model refinement
 * Restricted to API subscribers with valid authentication
 */
export async function submitFeedback(
  feedback: FeedbackData, 
  proof: string, 
  api_key: string
): Promise<{ success: boolean; message: string; validation?: ValidationMetrics }> {
  try {
    // Validate API key and subscription status
    const authResponse = await fetch('/.netlify/functions/validateApiKey', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify({ api_key })
    });

    if (!authResponse.ok) {
      throw new Error('Invalid API key or subscription required');
    }

    // Submit feedback with zk-SNARK proof
    const response = await fetch('/.netlify/functions/submitFeedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify({ 
        feedback: {
          ...feedback,
          zk_proof: proof
        },
        proof,
        api_key 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }

    const result = await response.json();
    
    // Log feedback submission
    await logFeedbackSubmission(feedback, api_key);
    
    return {
      success: true,
      message: 'Feedback submitted successfully. Model refinement in progress.',
      validation: result.validation_metrics
    };
  } catch (error) {
    console.error('Feedback submission error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit feedback'
    };
  }
}

/**
 * Validate synthetic data quality using statistical tests
 */
export async function validateDataQuality(
  real_data: number[], 
  synthetic_data: number[]
): Promise<ValidationMetrics> {
  try {
    const response = await fetch('/.netlify/functions/validateDataQuality', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ real_data, synthetic_data })
    });

    if (!response.ok) {
      throw new Error('Failed to validate data quality');
    }

    return await response.json();
  } catch (error) {
    console.error('Data validation error:', error);
    throw error;
  }
}

/**
 * Get feedback learning statistics for client dashboard
 */
export async function getFeedbackStats(api_key: string): Promise<{
  total_feedback: number;
  model_improvements: number;
  quality_score: number;
  authentes_contribution: number;
}> {
  try {
    const response = await fetch('/.netlify/functions/getFeedbackStats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${api_key}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get feedback statistics');
    }

    return await response.json();
  } catch (error) {
    console.error('Feedback stats error:', error);
    throw error;
  }
}

/**
 * Log feedback submission for analytics and Authentes training
 */
async function logFeedbackSubmission(feedback: FeedbackData, api_key: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('feedback_submissions')
      .insert({
        suite: feedback.suite,
        field: feedback.field,
        action: feedback.action,
        params: feedback.params,
        description: feedback.description,
        client_id: feedback.client_id,
        zk_proof: feedback.zk_proof,
        api_key_hash: await hashApiKey(api_key),
        submitted_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging feedback submission:', error);
    }
  } catch (error) {
    console.error('Error logging feedback submission:', error);
  }
}

/**
 * Hash API key for privacy-preserving logging
 */
async function hashApiKey(api_key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(api_key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate example feedback for CREDRISE credit score refinement
 */
export function generateCreditScoreFeedback(
  mean: number = 700, 
  variance: number = 50
): FeedbackData {
  return {
    suite: 'CREDRISE',
    field: 'credit_score',
    action: 'adjust_distribution',
    params: { mean, variance },
    description: `Adjust credit score distribution to mean=${mean}, variance=${variance} for improved realism`
  };
}

/**
 * Generate example feedback for TRADEMARKET volume adjustment
 */
export function generateTradeVolumeFeedback(
  multiplier: number = 1.2
): FeedbackData {
  return {
    suite: 'TRADEMARKET',
    field: 'trade_volume',
    action: 'scale_values',
    params: { multiplier },
    description: `Scale trade volumes by ${multiplier}x to match current market conditions`
  };
}