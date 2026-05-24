import React, { useState, useEffect } from 'react';
import ModelCollapseRiskDial from '../ModelCollapseRiskDial/ModelCollapseRiskDial';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ReportingDashboardProps {
  schema: any;
  seedData: any[];
  generatedData: any[];
  benchmarkResults: any[];
}

interface DashboardMetrics {
  generationProgress: {
    recordsGenerated: number;
    targetRecords: number;
    generationSpeed: number;
    estimatedTimeRemaining: number;
  };
  qualityMetrics: {
    fidelityScore: number;
    privacyScore: number;
    utilityScore: number;
    overallScore: number;
  };
  costMetrics: {
    costPerRecord: number;
    totalCost: number;
    efficiencyScore: number;
  };
  riskMetrics: {
    collapseRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskFactors: string[];
    recommendations: string[];
  };
}

interface ModelCollapseRisk {
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

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({
  schema,
  seedData,
  generatedData,
  benchmarkResults
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    generationProgress: {
      recordsGenerated: 0,
      targetRecords: 1000,
      generationSpeed: 0,
      estimatedTimeRemaining: 0
    },
    qualityMetrics: {
      fidelityScore: 0,
      privacyScore: 0,
      utilityScore: 0,
      overallScore: 0
    },
    costMetrics: {
      costPerRecord: 0,
      totalCost: 0,
      efficiencyScore: 0
    },
    riskMetrics: {
      collapseRisk: 'LOW',
      riskFactors: [],
      recommendations: []
    }
  });

  const [collapseRisk, setCollapseRisk] = useState<ModelCollapseRisk>({
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

  const [alerts, setAlerts] = useState({
    qualityAlerts: {
      fidelityDrop: false,
      privacyBreach: false,
      utilityLoss: false
    },
    riskAlerts: {
      collapseRisk: false,
      diversityLoss: false,
      noveltyLoss: false
    },
    costAlerts: {
      costOverrun: false,
      efficiencyDrop: false,
      resourceExhaustion: false
    }
  });

  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [modelPerformanceData, setModelPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    calculateMetrics();
    detectModelCollapse();
    generateTimeSeriesData();
    updateAlerts();
  }, [generatedData, benchmarkResults]);

  const calculateMetrics = () => {
    if (generatedData.length === 0) return;

    // Calculate quality metrics
    const fidelityScore = calculateFidelityScore(seedData, generatedData);
    const privacyScore = calculatePrivacyScore(seedData, generatedData);
    const utilityScore = calculateUtilityScore(generatedData);
    const overallScore = (fidelityScore + privacyScore + utilityScore) / 3;

    // Calculate cost metrics
    const costPerRecord = 0.001; // $0.001 per record
    const totalCost = generatedData.length * costPerRecord;
    const efficiencyScore = calculateEfficiencyScore(generatedData.length, totalCost);

    setMetrics(prev => ({
      ...prev,
      generationProgress: {
        recordsGenerated: generatedData.length,
        targetRecords: schema.targetVolume,
        generationSpeed: 100, // records per second
        estimatedTimeRemaining: Math.max(0, (schema.targetVolume - generatedData.length) / 100)
      },
      qualityMetrics: {
        fidelityScore,
        privacyScore,
        utilityScore,
        overallScore
      },
      costMetrics: {
        costPerRecord,
        totalCost,
        efficiencyScore
      }
    }));
  };

  const calculateFidelityScore = (realData: any[], syntheticData: any[]): number => {
    // Simplified KS test implementation
    let totalScore = 0;
    const fields = schema.fields;
    
    for (const field of fields) {
      const realValues = realData.map(d => d[field.name]).filter(v => v !== null && v !== undefined);
      const syntheticValues = syntheticData.map(d => d[field.name]).filter(v => v !== null && v !== undefined);
      
      if (realValues.length > 0 && syntheticValues.length > 0) {
        const similarity = calculateFieldSimilarity(realValues, syntheticValues);
        totalScore += similarity;
      }
    }
    
    return Math.min(1, totalScore / fields.length);
  };

  const calculateFieldSimilarity = (realValues: any[], syntheticValues: any[]): number => {
    // Simplified similarity calculation
    const realMean = realValues.reduce((a, b) => a + b, 0) / realValues.length;
    const syntheticMean = syntheticValues.reduce((a, b) => a + b, 0) / syntheticValues.length;
    const meanDiff = Math.abs(realMean - syntheticMean) / Math.max(realMean, 1);
    
    return Math.max(0, 1 - meanDiff);
  };

  const calculatePrivacyScore = (realData: any[], syntheticData: any[]): number => {
    // Simplified privacy score based on data overlap
    const realHashes = new Set(realData.map(d => JSON.stringify(d)));
    const syntheticHashes = new Set(syntheticData.map(d => JSON.stringify(d)));
    
    const overlap = [...realHashes].filter(hash => syntheticHashes.has(hash)).length;
    const privacyScore = 1 - (overlap / Math.max(realData.length, 1));
    
    return Math.max(0, privacyScore);
  };

  const calculateUtilityScore = (syntheticData: any[]): number => {
    // Simplified utility score based on data diversity
    const uniqueValues = new Set();
    syntheticData.forEach(record => {
      Object.values(record).forEach(value => uniqueValues.add(value));
    });
    
    const diversityRatio = uniqueValues.size / (syntheticData.length * Object.keys(syntheticData[0] || {}).length);
    return Math.min(1, diversityRatio);
  };

  const calculateEfficiencyScore = (recordsGenerated: number, totalCost: number): number => {
    const costPerRecord = totalCost / Math.max(recordsGenerated, 1);
    const targetCost = 0.001; // $0.001 per record target
    return Math.max(0, 1 - (costPerRecord - targetCost) / targetCost);
  };

  const detectModelCollapse = () => {
    if (generatedData.length === 0) return;

    const diversityLoss = calculateDiversityLoss();
    const modeCollapse = calculateModeCollapse();
    const qualityDegradation = calculateQualityDegradation();
    const noveltyScore = calculateNoveltyScore();

    const riskLevel = assessRiskLevel({ diversityLoss, modeCollapse, qualityDegradation, noveltyScore });
    const recommendations = generateRecommendations(riskLevel, { diversityLoss, modeCollapse, qualityDegradation, noveltyScore });

    setCollapseRisk({
      riskLevel,
      indicators: { diversityLoss, modeCollapse, qualityDegradation, noveltyScore },
      recommendations,
      mitigationStrategies: generateMitigationStrategies(riskLevel)
    });

    setMetrics(prev => ({
      ...prev,
      riskMetrics: {
        collapseRisk: riskLevel,
        riskFactors: Object.entries({ diversityLoss, modeCollapse, qualityDegradation, noveltyScore })
          .filter(([_, value]) => value > 0.5)
          .map(([key, _]) => key),
        recommendations
      }
    }));
  };

  const calculateDiversityLoss = (): number => {
    const uniqueRecords = new Set(generatedData.map(d => JSON.stringify(d)));
    const diversityRatio = uniqueRecords.size / generatedData.length;
    return 1 - diversityRatio;
  };

  const calculateModeCollapse = (): number => {
    // Simplified mode collapse detection
    const fieldValues = schema.fields.map(field => {
      const values = generatedData.map(d => d[field.name]);
      const uniqueValues = new Set(values);
      return uniqueValues.size / values.length;
    });
    
    const avgDiversity = fieldValues.reduce((a, b) => a + b, 0) / fieldValues.length;
    return 1 - avgDiversity;
  };

  const calculateQualityDegradation = (): number => {
    // Simplified quality degradation
    const nullValues = generatedData.filter(record => 
      Object.values(record).some(value => value === null || value === undefined)
    ).length;
    
    return nullValues / generatedData.length;
  };

  const calculateNoveltyScore = (): number => {
    if (seedData.length === 0) return 0.5;
    
    const seedHashes = new Set(seedData.map(d => JSON.stringify(d)));
    const syntheticHashes = new Set(generatedData.map(d => JSON.stringify(d)));
    
    const novelRecords = [...syntheticHashes].filter(hash => !seedHashes.has(hash)).length;
    return novelRecords / generatedData.length;
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

  const generateTimeSeriesData = () => {
    const data = [];
    const now = Date.now();
    
    for (let i = 10; i >= 0; i--) {
      const time = now - (i * 60000); // 1 minute intervals
      data.push({
        time: new Date(time).toLocaleTimeString(),
        fidelity: 0.85 + Math.random() * 0.1,
        privacy: 0.9 + Math.random() * 0.05,
        utility: 0.8 + Math.random() * 0.15,
        cost: 0.001 + Math.random() * 0.0005
      });
    }
    
    setTimeSeriesData(data);
  };

  const updateAlerts = () => {
    const newAlerts = {
      qualityAlerts: {
        fidelityDrop: metrics.qualityMetrics.fidelityScore < 0.8,
        privacyBreach: metrics.qualityMetrics.privacyScore < 0.85,
        utilityLoss: metrics.qualityMetrics.utilityScore < 0.75
      },
      riskAlerts: {
        collapseRisk: collapseRisk.riskLevel === 'HIGH' || collapseRisk.riskLevel === 'CRITICAL',
        diversityLoss: collapseRisk.indicators.diversityLoss > 0.5,
        noveltyLoss: collapseRisk.indicators.noveltyScore < 0.3
      },
      costAlerts: {
        costOverrun: metrics.costMetrics.costPerRecord > 0.002,
        efficiencyDrop: metrics.costMetrics.efficiencyScore < 0.7,
        resourceExhaustion: false // Would be calculated based on system resources
      }
    };
    
    setAlerts(newAlerts);
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertColor = (hasAlert: boolean): string => {
    return hasAlert ? 'text-red-600 bg-red-100 border-red-300' : 'text-green-600 bg-green-100 border-green-300';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Comprehensive Reporting Dashboard</h1>
            <p className="text-gray-600">Real-time monitoring of synthetic data generation quality, costs, and risks</p>
          </div>
          <div className="text-sm text-gray-700 bg-gray-50 border rounded px-3 py-2">
            <div><span className="font-semibold">ε</span>: {schema?.privacySettings?.epsilon ?? '—'}</div>
            <div><span className="font-semibold">Synthetic Ratio</span>: {schema?.privacySettings?.syntheticRatio ?? '—'}%</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Quality Score</h3>
          <p className="text-3xl font-bold text-blue-600">{(metrics.qualityMetrics.overallScore * 100).toFixed(1)}%</p>
          <p className="text-sm text-gray-500">Overall data quality</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Records Generated</h3>
          <p className="text-3xl font-bold text-green-600">{metrics.generationProgress.recordsGenerated.toLocaleString()}</p>
          <p className="text-sm text-gray-500">of {metrics.generationProgress.targetRecords.toLocaleString()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Cost per Record</h3>
          <p className="text-3xl font-bold text-purple-600">${metrics.costMetrics.costPerRecord.toFixed(4)}</p>
          <p className="text-sm text-gray-500">Generation efficiency</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Collapse Risk</h3>
          <p className={`text-3xl font-bold ${getRiskColor(collapseRisk.riskLevel).split(' ')[0]}`}>
            {collapseRisk.riskLevel}
          </p>
          <p className="text-sm text-gray-500">Model stability</p>
        </div>
      </div>

      {/* Quality Metrics Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Quality Metrics Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="fidelity" stroke="#3B82F6" strokeWidth={2} />
            <Line type="monotone" dataKey="privacy" stroke="#10B981" strokeWidth={2} />
            <Line type="monotone" dataKey="utility" stroke="#8B5CF6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model Collapse Risk Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🚨 Model Collapse Risk Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Radar Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Indicators</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                {
                  subject: 'Diversity Loss',
                  A: collapseRisk.indicators.diversityLoss * 100,
                  fullMark: 100,
                },
                {
                  subject: 'Mode Collapse',
                  A: collapseRisk.indicators.modeCollapse * 100,
                  fullMark: 100,
                },
                {
                  subject: 'Quality Degradation',
                  A: collapseRisk.indicators.qualityDegradation * 100,
                  fullMark: 100,
                },
                {
                  subject: 'Novelty Score',
                  A: collapseRisk.indicators.noveltyScore * 100,
                  fullMark: 100,
                },
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Risk Level" dataKey="A" stroke="#EF4444" fill="#FEE2E2" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Assessment</h3>
            <div className={`p-4 rounded-lg border-2 ${getRiskColor(collapseRisk.riskLevel)}`}>
              <h4 className="font-bold mb-2">Current Risk Level: {collapseRisk.riskLevel}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Diversity Loss:</span>
                  <span className="font-semibold">{(collapseRisk.indicators.diversityLoss * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode Collapse:</span>
                  <span className="font-semibold">{(collapseRisk.indicators.modeCollapse * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality Degradation:</span>
                  <span className="font-semibold">{(collapseRisk.indicators.qualityDegradation * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Novelty Score:</span>
                  <span className="font-semibold">{(collapseRisk.indicators.noveltyScore * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {collapseRisk.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-gray-800 mb-2">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {collapseRisk.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Risk Dial (Interactive) */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <ModelCollapseRiskDial syntheticData={generatedData} schema={schema} />
      </div>

      {/* Alert System */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Alert System</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quality Alerts */}
          <div className={`p-4 rounded-lg border-2 ${getAlertColor(Object.values(alerts.qualityAlerts).some(alert => alert))}`}>
            <h3 className="font-semibold mb-2">Quality Alerts</h3>
            <div className="space-y-1 text-sm">
              <div className={`flex justify-between ${alerts.qualityAlerts.fidelityDrop ? 'text-red-600' : 'text-green-600'}`}>
                <span>Fidelity Drop:</span>
                <span>{alerts.qualityAlerts.fidelityDrop ? '⚠️' : '✅'}</span>
              </div>
              <div className={`flex justify-between ${alerts.qualityAlerts.privacyBreach ? 'text-red-600' : 'text-green-600'}`}>
                <span>Privacy Breach:</span>
                <span>{alerts.qualityAlerts.privacyBreach ? '⚠️' : '✅'}</span>
              </div>
              <div className={`flex justify-between ${alerts.qualityAlerts.utilityLoss ? 'text-red-600' : 'text-green-600'}`}>
                <span>Utility Loss:</span>
                <span>{alerts.qualityAlerts.utilityLoss ? '⚠️' : '✅'}</span>
              </div>
            </div>
          </div>

          {/* Risk Alerts */}
          <div className={`p-4 rounded-lg border-2 ${getAlertColor(Object.values(alerts.riskAlerts).some(alert => alert))}`}>
            <h3 className="font-semibold mb-2">Risk Alerts</h3>
            <div className="space-y-1 text-sm">
              <div className={`flex justify-between ${alerts.riskAlerts.collapseRisk ? 'text-red-600' : 'text-green-600'}`}>
                <span>Collapse Risk:</span>
                <span>{alerts.riskAlerts.collapseRisk ? '⚠️' : '✅'}</span>
              </div>
              <div className={`flex justify-between ${alerts.riskAlerts.diversityLoss ? 'text-red-600' : 'text-green-600'}`}>
                <span>Diversity Loss:</span>
                <span>{alerts.riskAlerts.diversityLoss ? '⚠️' : '✅'}</span>
              </div>
              <div className={`flex justify-between ${alerts.riskAlerts.noveltyLoss ? 'text-red-600' : 'text-green-600'}`}>
                <span>Novelty Loss:</span>
                <span>{alerts.riskAlerts.noveltyLoss ? '⚠️' : '✅'}</span>
              </div>
            </div>
          </div>

          {/* Cost Alerts */}
          <div className={`p-4 rounded-lg border-2 ${getAlertColor(Object.values(alerts.costAlerts).some(alert => alert))}`}>
            <h3 className="font-semibold mb-2">Cost Alerts</h3>
            <div className="space-y-1 text-sm">
              <div className={`flex justify-between ${alerts.costAlerts.costOverrun ? 'text-red-600' : 'text-green-600'}`}>
                <span>Cost Overrun:</span>
                <span>{alerts.costAlerts.costOverrun ? '⚠️' : '✅'}</span>
              </div>
              <div className={`flex justify-between ${alerts.costAlerts.efficiencyDrop ? 'text-red-600' : 'text-green-600'}`}>
                <span>Efficiency Drop:</span>
                <span>{alerts.costAlerts.efficiencyDrop ? '⚠️' : '✅'}</span>
              </div>
              <div className={`flex justify-between ${alerts.costAlerts.resourceExhaustion ? 'text-red-600' : 'text-green-600'}`}>
                <span>Resource Exhaustion:</span>
                <span>{alerts.costAlerts.resourceExhaustion ? '⚠️' : '✅'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quality Breakdown */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Quality Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Fidelity', value: metrics.qualityMetrics.fidelityScore * 100 },
              { name: 'Privacy', value: metrics.qualityMetrics.privacyScore * 100 },
              { name: 'Utility', value: metrics.qualityMetrics.utilityScore * 100 }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">💰 Cost Analysis</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Cost per Record:</span>
              <span className="font-semibold">${metrics.costMetrics.costPerRecord.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total Cost:</span>
              <span className="font-semibold">${metrics.costMetrics.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Efficiency Score:</span>
              <span className="font-semibold">{(metrics.costMetrics.efficiencyScore * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Records per Dollar:</span>
              <span className="font-semibold">{Math.round(1 / metrics.costMetrics.costPerRecord).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📤 Export & Reporting</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Export Quality Report
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Export Cost Analysis
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            Export Risk Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportingDashboard; 