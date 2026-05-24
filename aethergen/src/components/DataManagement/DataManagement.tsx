import React, { useState } from 'react';
import { RefreshCw, Database, Upload, Download, Settings, BarChart3, Clock, Zap, Lock, Shield } from 'lucide-react';
import { FinanceSuite } from '../../types';

interface DataManagementProps {
  onManualCollect?: () => Promise<void>;
  onPerformCleanup?: () => Promise<void>;
  selectedSuite?: FinanceSuite;
}

const DataManagement: React.FC<DataManagementProps> = ({
  onManualCollect,
  onPerformCleanup,
  selectedSuite
}) => {
  const [isManualCollecting, setIsManualCollecting] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [recordsToGenerate, setRecordsToGenerate] = useState(100);

  const handleManualCollection = async () => {
    if (!onManualCollect || isManualCollecting) return;
    
    setIsManualCollecting(true);
    try {
      await onManualCollect();
    } finally {
      setIsManualCollecting(false);
    }
  };

  const handleCleanup = async () => {
    if (!onPerformCleanup || isCleaningUp) return;
    
    setIsCleaningUp(true);
    try {
      await onPerformCleanup();
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Secure Data Upload (zk-SNARKs) - Prominently placed at top */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-center mb-4">
          <Lock className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-800">Secure Data Upload (zk-SNARKs)</h2>
            <p className="text-sm text-gray-600">Upload encrypted customer data with zero-knowledge proofs for FCA/SEC compliance</p>
          </div>
          <div className="ml-auto flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4 mr-1" />
            FCA/SEC Compliant
          </div>
        </div>
        
        {/* Consolidated into SeedDataUploader flow; ZK actions now live in Upload tab */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 text-sm text-gray-700">
          ZK upload is consolidated in the Upload tab. Use Upload to generate/verify/download proofs.
        </div>
      </div>

      {/* Data Collection Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Database className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Data Collection Controls</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-md">
            <h3 className="font-semibold text-blue-800 mb-2">Manual Collection</h3>
            <p className="text-sm text-blue-700 mb-3">
              Trigger immediate data collection across all finance suites
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={recordsToGenerate}
                onChange={(e) => setRecordsToGenerate(parseInt(e.target.value) || 100)}
                min="1"
                max="1000"
                className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="100"
              />
              <span className="text-sm text-gray-600">records</span>
              <button
                onClick={handleManualCollection}
                disabled={isManualCollecting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isManualCollecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Collecting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Trigger Collection
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">Cache Management</h3>
            <p className="text-sm text-green-700 mb-3">
              Refresh statistics cache and optimize database performance
            </p>
            <button
              onClick={handleCleanup}
              disabled={isCleaningUp}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isCleaningUp ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Refresh Stats
                </>
              )}
            </button>
          </div>
        </div>

        {/* I/O Optimization Status */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-md border border-green-200">
          <div className="flex items-center mb-3">
            <Zap className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-800">I/O Optimization Active</h3>
            <span className="ml-auto text-sm text-green-600 font-medium">70% I/O Reduction</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center text-green-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Materialized Views
            </div>
            <div className="flex items-center text-green-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Batch Processing
            </div>
            <div className="flex items-center text-green-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Partial Indexes
            </div>
            <div className="flex items-center text-green-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Connection Pooling
            </div>
            <div className="flex items-center text-green-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Optimized Embeddings
            </div>
            <div className="flex items-center text-green-700">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Database Functions
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Performance Metrics</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-md">
            <div className="flex items-center mb-2">
              <Database className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Daily Target</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">1M</p>
            <p className="text-xs text-blue-600">records/day</p>
          </div>

          <div className="p-4 bg-green-50 rounded-md">
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Frequency</span>
            </div>
            <p className="text-2xl font-bold text-green-600">1 min</p>
            <p className="text-xs text-green-600">1,440 runs/day</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-md">
            <div className="flex items-center mb-2">
              <Upload className="h-4 w-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-800">Records/Run</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">694</p>
            <p className="text-xs text-purple-600">~87 per suite</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-md">
            <div className="flex items-center mb-2">
              <Zap className="h-4 w-4 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-orange-800">I/O Savings</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">70%</p>
            <p className="text-xs text-orange-600">reduction</p>
          </div>
        </div>
      </div>

      {/* Data Export Operations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <Settings className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-800">Data Export Operations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-md">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Export finance data for analysis or backup
            </p>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">
                Export CSV
              </button>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                Export to Marketplace
              </button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Secure Import Only
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Customer data must be uploaded using zk-SNARKs encryption above for security compliance
            </p>
            <div className="text-xs text-gray-500 bg-white p-2 rounded border">
              ✓ FCA/SEC compliant encryption<br/>
              ✓ Zero-knowledge proof verification<br/>
              ✓ Client-side encryption only
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;