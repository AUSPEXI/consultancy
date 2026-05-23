import React, { useState, useEffect, useRef } from 'react';

interface ModelCollapseRiskDialProps {
  syntheticData: any[];
  schema: any;
  onRiskChange?: (riskLevel: string, recommendations: string[]) => void;
}

interface CollapseRisk {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  indicators: {
    diversityLoss: number;
    modeCollapse: number;
    qualityDegradation: number;
    noveltyScore: number;
  };
  recommendations: string[];
  mitigationStrategies: string[];
}

const ModelCollapseRiskDial: React.FC<ModelCollapseRiskDialProps> = ({
  syntheticData,
  schema,
  onRiskChange
}) => {
  const [collapseRisk, setCollapseRisk] = useState<CollapseRisk>({
    riskLevel: 'LOW',
    indicators: {
      diversityLoss: 0.1,
      modeCollapse: 0.05,
      qualityDegradation: 0.02,
      noveltyScore: 0.85
    },
    recommendations: [],
    mitigationStrategies: []
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(0.7);
  const [monitoringStartTime, setMonitoringStartTime] = useState<number | null>(null);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const monitoringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Start monitoring automatically when syntheticData changes
  useEffect(() => {
    if (syntheticData.length > 0 && !isMonitoring) {
      startMonitoring();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syntheticData]);

  // Inactivity detection (pause after 10 min inactivity)
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isMonitoring && syntheticData.length > 0) {
        startMonitoring();
      }
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    inactivityTimeoutRef.current = setInterval(() => {
      if (isMonitoring && Date.now() - lastActivityRef.current > 10 * 60 * 1000) {
        stopMonitoring();
      }
    }, 60 * 1000);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (inactivityTimeoutRef.current) clearInterval(inactivityTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMonitoring, syntheticData]);

  // Auto-stop after 30 minutes, show prompt
  useEffect(() => {
    if (isMonitoring) {
      setMonitoringStartTime(Date.now());
      monitoringTimeoutRef.current = setTimeout(() => {
        setShowContinuePrompt(true);
      }, 30 * 60 * 1000);
    } else {
      setMonitoringStartTime(null);
      setShowContinuePrompt(false);
      if (monitoringTimeoutRef.current) clearTimeout(monitoringTimeoutRef.current);
    }
    return () => {
      if (monitoringTimeoutRef.current) clearTimeout(monitoringTimeoutRef.current);
    };
  }, [isMonitoring]);

  const detectModelCollapse = () => {
    if (syntheticData.length === 0) return;

    const diversityLoss = calculateDiversityLoss();
    const modeCollapse = calculateModeCollapse();
    const qualityDegradation = calculateQualityDegradation();
    const noveltyScore = calculateNoveltyScore();

    const riskLevel = assessRiskLevel({ diversityLoss, modeCollapse, qualityDegradation, noveltyScore });
    const recommendations = generateRecommendations(riskLevel, { diversityLoss, modeCollapse, qualityDegradation, noveltyScore });
    const mitigationStrategies = generateMitigationStrategies(riskLevel);

    const newRisk = {
      riskLevel,
      indicators: { diversityLoss, modeCollapse, qualityDegradation, noveltyScore },
      recommendations,
      mitigationStrategies
    };

    setCollapseRisk(newRisk);
    onRiskChange?.(riskLevel, recommendations);
  };

  const calculateDiversityLoss = (): number => {
    const uniqueRecords = new Set(syntheticData.map(d => JSON.stringify(d)));
    const diversityRatio = uniqueRecords.size / syntheticData.length;
    return 1 - diversityRatio;
  };

  const calculateModeCollapse = (): number => {
    if (schema.fields.length === 0) return 0;
    
    const fieldDiversities = schema.fields.map(field => {
      const values = syntheticData.map(d => d[field.name]).filter(v => v !== null && v !== undefined);
      if (values.length === 0) return 1;
      
      const uniqueValues = new Set(values);
      return uniqueValues.size / values.length;
    });
    
    const avgDiversity = fieldDiversities.reduce((a, b) => a + b, 0) / fieldDiversities.length;
    return 1 - avgDiversity;
  };

  const calculateQualityDegradation = (): number => {
    const nullValues = syntheticData.filter(record => 
      Object.values(record).some(value => value === null || value === undefined)
    ).length;
    
    return nullValues / syntheticData.length;
  };

  const calculateNoveltyScore = (): number => {
    // Simplified novelty calculation
    const uniqueValues = new Set();
    syntheticData.forEach(record => {
      Object.values(record).forEach(value => {
        if (value !== null && value !== undefined) {
          uniqueValues.add(value);
        }
      });
    });
    
    const totalPossibleValues = syntheticData.length * Object.keys(syntheticData[0] || {}).length;
    return uniqueValues.size / Math.max(totalPossibleValues, 1);
  };

  const assessRiskLevel = (indicators: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    const avgRisk = Object.values(indicators).reduce((a: number, b: number) => a + b, 0) / Object.keys(indicators).length;
    
    if (avgRisk < 0.2) return 'LOW';
    if (avgRisk < 0.4) return 'MEDIUM';
    if (avgRisk < 0.6) return 'HIGH';
    return 'CRITICAL';
  };

  const generateRecommendations = (riskLevel: string, indicators: any): string[] => {
    const recommendations = [];
    
    if (indicators.diversityLoss > 0.3) {
      recommendations.push('Increase diversity through adversarial training');
    }
    if (indicators.modeCollapse > 0.3) {
      recommendations.push('Implement regularization to prevent mode collapse');
    }
    if (indicators.qualityDegradation > 0.2) {
      recommendations.push('Add quality gates to prevent degradation');
    }
    if (indicators.noveltyScore < 0.5) {
      recommendations.push('Introduce controlled randomness for novelty');
    }
    
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      recommendations.push('Consider reducing learning rate');
      recommendations.push('Implement early stopping mechanisms');
    }
    
    return recommendations;
  };

  const generateMitigationStrategies = (riskLevel: string): string[] => {
    switch (riskLevel) {
      case 'LOW':
        return ['Continue monitoring', 'Maintain current parameters'];
      case 'MEDIUM':
        return ['Increase diversity penalties', 'Add regularization terms'];
      case 'HIGH':
        return ['Implement quality gates', 'Add adversarial training', 'Reduce learning rate'];
      case 'CRITICAL':
        return ['Stop generation immediately', 'Retrain models', 'Review data pipeline'];
      default:
        return [];
    }
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-100 border-green-300';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getRiskIcon = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'LOW': return '✅';
      case 'MEDIUM': return '⚠️';
      case 'HIGH': return '🚨';
      case 'CRITICAL': return '💥';
      default: return '❓';
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    setMonitoringStartTime(Date.now());
    // Start real-time monitoring
    const interval = setInterval(() => {
      detectModelCollapse();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setShowContinuePrompt(false);
  };

  const handleContinueMonitoring = () => {
    setShowContinuePrompt(false);
    setMonitoringStartTime(Date.now());
    if (monitoringTimeoutRef.current) clearTimeout(monitoringTimeoutRef.current);
    monitoringTimeoutRef.current = setTimeout(() => {
      setShowContinuePrompt(true);
    }, 30 * 60 * 1000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🚨 Model Collapse Risk Dial</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded-md font-medium ${
              isMonitoring 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Alert Threshold:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-600">{(alertThreshold * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      {showContinuePrompt && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4 flex items-center justify-between">
          <span>Monitoring has been active for 30 minutes. Continue monitoring?</span>
          <button
            onClick={handleContinueMonitoring}
            className="ml-4 px-4 py-2 bg-yellow-400 text-white rounded hover:bg-yellow-500 font-semibold"
          >
            Continue
          </button>
          <button
            onClick={stopMonitoring}
            className="ml-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 font-semibold"
          >
            Stop
          </button>
        </div>
      )}

      {/* Risk Level Display */}
      <div className={`p-6 rounded-lg border-2 ${getRiskColor(collapseRisk.riskLevel)} mb-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">
              {getRiskIcon(collapseRisk.riskLevel)} Current Risk Level: {collapseRisk.riskLevel}
            </h3>
            <p className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {getRiskIcon(collapseRisk.riskLevel)}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Indicators</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Diversity Loss</span>
                <span className="text-sm font-semibold">{(collapseRisk.indicators.diversityLoss * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    collapseRisk.indicators.diversityLoss > 0.5 ? 'bg-red-500' : 
                    collapseRisk.indicators.diversityLoss > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${collapseRisk.indicators.diversityLoss * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Mode Collapse</span>
                <span className="text-sm font-semibold">{(collapseRisk.indicators.modeCollapse * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    collapseRisk.indicators.modeCollapse > 0.5 ? 'bg-red-500' : 
                    collapseRisk.indicators.modeCollapse > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${collapseRisk.indicators.modeCollapse * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Quality Degradation</span>
                <span className="text-sm font-semibold">{(collapseRisk.indicators.qualityDegradation * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    collapseRisk.indicators.qualityDegradation > 0.5 ? 'bg-red-500' : 
                    collapseRisk.indicators.qualityDegradation > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${collapseRisk.indicators.qualityDegradation * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Novelty Score</span>
                <span className="text-sm font-semibold">{(collapseRisk.indicators.noveltyScore * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    collapseRisk.indicators.noveltyScore < 0.3 ? 'bg-red-500' : 
                    collapseRisk.indicators.noveltyScore < 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${collapseRisk.indicators.noveltyScore * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
          {collapseRisk.recommendations.length > 0 ? (
            <ul className="space-y-2">
              {collapseRisk.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No immediate actions required</p>
          )}

          <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">Mitigation Strategies</h4>
          <ul className="space-y-1">
            {collapseRisk.mitigationStrategies.map((strategy, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-gray-600">{strategy}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Alert System */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⚠️ Alert System</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${
            collapseRisk.indicators.diversityLoss > alertThreshold 
              ? 'border-red-300 bg-red-50' 
              : 'border-green-300 bg-green-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Diversity Alert</span>
              <span>{collapseRisk.indicators.diversityLoss > alertThreshold ? '🚨' : '✅'}</span>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            collapseRisk.indicators.modeCollapse > alertThreshold 
              ? 'border-red-300 bg-red-50' 
              : 'border-green-300 bg-green-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Mode Collapse Alert</span>
              <span>{collapseRisk.indicators.modeCollapse > alertThreshold ? '🚨' : '✅'}</span>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${
            collapseRisk.indicators.qualityDegradation > alertThreshold 
              ? 'border-red-300 bg-red-50' 
              : 'border-green-300 bg-green-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">Quality Alert</span>
              <span>{collapseRisk.indicators.qualityDegradation > alertThreshold ? '🚨' : '✅'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Monitoring: {isMonitoring ? '🟢 Active' : '🔴 Inactive'}</span>
          <span>Records: {syntheticData.length}</span>
          <span>Last Check: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Alert Threshold: {(alertThreshold * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ModelCollapseRiskDial; 