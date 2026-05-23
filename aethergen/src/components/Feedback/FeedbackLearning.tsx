import React, { useState } from 'react';
import { Brain, Send, CheckCircle, AlertCircle, TrendingUp, Settings } from 'lucide-react';

interface FeedbackData {
  suite: string;
  field: string;
  action: string;
  params: { [key: string]: any };
  description: string;
}

const FeedbackLearning: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    suite: 'CREDRISE',
    field: 'credit_score',
    action: 'adjust_distribution',
    params: { mean: 700, variance: 50 },
    description: ''
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const suites = ['INSUREAI', 'SHIELD', 'CREDRISE', 'TRADEMARKET', 'CASHFLOW', 'CONSUME', 'TAXGUARD', 'RISKSHIELD'];
  const fields = ['credit_score', 'transaction_volume', 'risk_weight', 'anomaly_score', 'arima_forecast'];
  const actions = [
    'adjust_distribution',
    'prune_outliers',
    'weight_adjustment',
    'feature_enhancement',
    'correlation_tuning'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    try {
      // Simulate feedback submission to meta-learning API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResult = {
        feedback_id: `fb_${Date.now()}`,
        status: 'accepted',
        estimated_improvement: Math.random() * 0.15 + 0.05, // 5-20% improvement
        processing_time: '2-3 hours',
        affected_models: ['T5-Small', 'IsolationForest', 'VAE'],
        next_deployment: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
      };

      setSubmissionResult(mockResult);
      setSubmitStatus('success');

      // Reset form after successful submission
      setTimeout(() => {
        setFeedback({
          suite: 'CREDRISE',
          field: 'credit_score',
          action: 'adjust_distribution',
          params: { mean: 700, variance: 50 },
          description: ''
        });
        setSubmitStatus('idle');
        setSubmissionResult(null);
      }, 5000);

    } catch (error) {
      console.error('Feedback submission failed:', error);
      setSubmitStatus('error');
    }
  };

  const updateParams = (key: string, value: any) => {
    setFeedback(prev => ({
      ...prev,
      params: { ...prev.params, [key]: value }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-6">
          <Brain className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Feedback Learning System</h2>
            <p className="text-gray-600">Submit refinements to improve synthetic financial data quality and model performance</p>
          </div>
        </div>

        {/* Learning Process Overview */}
        <div className="bg-blue-50 p-4 rounded-md mb-6">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            How Feedback Learning Works
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Submit refinements based on your financial data validation results</p>
            <p>• Meta-learning model processes feedback to improve AI models</p>
            <p>• Updated models deployed within 2-3 hours</p>
            <p>• Continuous improvement cycle enhances synthetic financial data realism</p>
          </div>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Suite
              </label>
              <select
                value={feedback.suite}
                onChange={(e) => setFeedback(prev => ({ ...prev, suite: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {suites.map(suite => (
                  <option key={suite} value={suite}>{suite}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Field
              </label>
              <select
                value={feedback.field}
                onChange={(e) => setFeedback(prev => ({ ...prev, field: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {fields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refinement Action
              </label>
              <select
                value={feedback.action}
                onChange={(e) => setFeedback(prev => ({ ...prev, action: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {actions.map(action => (
                  <option key={action} value={action}>
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Settings className="h-4 w-4 inline mr-1" />
                Parameters
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  step="1"
                  placeholder="Mean (700)"
                  value={feedback.params.mean || ''}
                  onChange={(e) => updateParams('mean', parseFloat(e.target.value) || 700)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  step="1"
                  placeholder="Variance (50)"
                  value={feedback.params.variance || ''}
                  onChange={(e) => updateParams('variance', parseFloat(e.target.value) || 50)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description & Rationale
            </label>
            <textarea
              value={feedback.description}
              onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the issue with current synthetic financial data and expected improvement..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitStatus === 'submitting'}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {submitStatus === 'submitting' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Feedback...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </button>
        </form>

        {/* Success Result */}
        {submitStatus === 'success' && submissionResult && (
          <div className="mt-6 bg-green-50 p-4 rounded-md">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-green-800">Feedback Accepted Successfully</h3>
            </div>
            <div className="text-sm text-green-700 space-y-2">
              <p><strong>Feedback ID:</strong> {submissionResult.feedback_id}</p>
              <p><strong>Estimated Improvement:</strong> {(submissionResult.estimated_improvement * 100).toFixed(1)}%</p>
              <p><strong>Processing Time:</strong> {submissionResult.processing_time}</p>
              <p><strong>Affected Models:</strong> {submissionResult.affected_models.join(', ')}</p>
              <p><strong>Next Deployment:</strong> {new Date(submissionResult.next_deployment).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {submitStatus === 'error' && (
          <div className="mt-6 bg-red-50 p-4 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="font-semibold text-red-800">Feedback Submission Failed</h3>
            </div>
            <p className="text-sm text-red-700 mt-2">
              Unable to process feedback. Please check your parameters and try again.
            </p>
          </div>
        )}

        {/* Code Examples */}
        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">API Integration Examples</h3>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-700 mb-2">Python Feedback Submission</h4>
              <pre className="text-sm text-gray-600 overflow-x-auto">
{`import requests

feedback = {
    'suite': 'CREDRISE',
    'field': 'credit_score',
    'action': 'adjust_distribution',
    'params': {'mean': 700, 'variance': 50},
    'description': 'Credit score distribution too narrow'
}

response = requests.post(
    'https://sdsp.auspexi.com/api/feedback',
    json=feedback,
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)

result = response.json()
print(f"Feedback ID: {result['feedback_id']}")
print(f"Estimated improvement: {result['estimated_improvement']:.1%}")`}
              </pre>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">Validation-Based Feedback</h4>
            <pre className="text-sm text-gray-600 overflow-x-auto">
{`# After running KS test validation
from scipy.stats import ks_2samp

real_data = pd.read_csv('client_real_data.csv')['credit_score']
synthetic_data = pd.read_csv('auspexi_synthetic_data.csv')['credit_score']

stat, p_value = ks_2samp(real_data, synthetic_data)
print(f"KS Test p-value: {p_value}")

# p > 0.05 indicates synthetic data is realistic enough
if p_value < 0.05:  # Synthetic data not realistic enough
    feedback = {
        'suite': 'CREDRISE',
        'field': 'credit_score',
        'action': 'adjust_distribution',
        'params': {
            'target_mean': real_data.mean(),
            'target_std': real_data.std()
        },
        'description': f'KS test failed (p={p_value:.3f}), adjust to match real distribution'
    }
    
    # Submit feedback for model improvement
    submit_feedback(feedback)`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackLearning;