import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Database, 
  Settings, 
  Users, 
  CreditCard, 
  Shield, 
  Activity,
  ChevronRight,
  LogOut,
  User,
  GitBranch,
  Upload,
  BadgeCheck,
  LineChart
} from 'lucide-react';
import { getEntitlements } from '../../services/entitlementsClient';
import { entitlementsToRole, roleHas } from '../../services/rbacService';
import type { SchemaField } from '../../types/schema';
import ReportingDashboard from '../ReportingDashboard/ReportingDashboard';
import SyntheticDataGenerator from '../SyntheticDataGenerator/SyntheticDataGenerator';
import SchemaDesigner from '../SchemaDesigner/SchemaDesigner';
import PipelineManager from '../SchemaDesigner/PipelineManager';
import DataCleaner from '../DataCleaner/DataCleaner';
import PrivacyMetrics from '../PrivacyMetrics/PrivacyMetrics';
import ModelCollapseRiskDial from '../ModelCollapseRiskDial/ModelCollapseRiskDial';
import { assertSupabase } from '../../services/supabaseClient';
import UpgradeGate from './UpgradeGate';
import SeedDataUploader from '../SeedDataUploader/SeedDataUploader';
import AdvancedBenchmarking from '../AdvancedBenchmarking/AdvancedBenchmarking';
import ModelLab from '../ModelLab/ModelLab';
import ModuleBenchmarks from '../DataCollection/ModuleBenchmarks';
import DatasetsLibrary from '../Libraries/DatasetsLibrary';
import ModelsLibrary from '../Libraries/ModelsLibrary';
import TemplatesLibrary from '../Libraries/TemplatesLibrary';
import MarketplaceHome from '../Marketplace/MarketplaceHome';
import ReviewTab from '../QA/ReviewTab';
const StorageUsagePanel: React.FC<{ role: 'viewer'|'developer'|'team'|'enterprise'|'admin' }> = ({ role }) => {
  const [usage, setUsage] = React.useState<{ datasetsBytes:number; datasetsCount:number; modelsCount:number; modelsBytes?:number }|null>(null);
  React.useEffect(()=>{ (async()=>{
    try {
      const ds = await fetch('/api/datasets?action=usage').then(r=>r.json());
      const md = await fetch('/api/models?action=usage').then(r=>r.json());
      setUsage({ datasetsBytes: ds.datasetsBytes||0, datasetsCount: ds.datasetsCount||0, modelsCount: md.modelsCount||0, modelsBytes: md.modelsBytes||0 });
    } catch {}
  })() },[]);
  const fmt = (n:number)=> new Intl.NumberFormat().format(n);
  const plan = (()=>{
    switch(role){
      case 'viewer': return { name:'Free', dsGB: 1, modelLimit: 1 };
      case 'developer': return { name:'Developer', dsGB: 5, modelLimit: 3 };
      case 'team': return { name:'Team', dsGB: 50, modelLimit: 10 };
      case 'enterprise': return { name:'Enterprise', dsGB: 500, modelLimit: 100 };
      case 'admin': return { name:'Enterprise', dsGB: 500, modelLimit: 100 };
      default: return { name:'Free', dsGB: 1, modelLimit: 1 };
    }
  })();
  const bytesLimit = plan.dsGB * 1024 * 1024 * 1024;
  const usedBytes = (usage?.datasetsBytes || 0) + (usage?.modelsBytes || 0);
  const usedPct = Math.min(100, Math.round((usedBytes/Math.max(1,bytesLimit))*100));
  const modelsUsed = usage?.modelsCount || 0;
  const modelsPct = Math.min(100, Math.round((modelsUsed/Math.max(1,plan.modelLimit))*100));
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-gray-600">Total Storage</div>
        <div className="text-xs text-gray-500">Plan: {plan.name} • Limit: {plan.dsGB} GB</div>
        <div className="mt-1 text-xl font-semibold">{usage? fmt(usedBytes): '—'} bytes</div>
        <div className="mt-2 h-2 bg-gray-200 rounded">
          <div className="h-2 bg-blue-600 rounded" style={{ width: `${usedPct}%` }} />
        </div>
        <div className="mt-1 text-xs text-gray-600">{usedPct}% used</div>
        {usage && (
          <div className="mt-2 text-xs text-gray-600">
            <div>Datasets: {fmt(usage.datasetsBytes||0)} bytes</div>
            <div>Models: {fmt(usage.modelsBytes||0)} bytes</div>
          </div>
        )}
      </div>
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-gray-600">Models</div>
        <div className="text-xs text-gray-500">Limit: {plan.modelLimit}</div>
        <div className="mt-1 text-xl font-semibold">{usage? fmt(modelsUsed): '—'}</div>
        <div className="mt-2 h-2 bg-gray-200 rounded">
          <div className="h-2 bg-green-600 rounded" style={{ width: `${modelsPct}%` }} />
        </div>
        <div className="mt-1 text-xs text-gray-600">{modelsPct}% of limit</div>
      </div>
      <div className="p-4 bg-gray-50 rounded">
        <div className="text-gray-600">Datasets (count)</div>
        <div className="text-xl font-semibold">{usage? fmt(usage.datasetsCount): '—'}</div>
      </div>
    </div>
  );
};

interface AethergenDashboardProps {
  userEmail: string;
  onLogout: () => void;
}

type DashboardTab =
  | 'overview'
  | 'schema'
  | 'upload'
  | 'generate'
  | 'clean'
  | 'ablation'
  | 'benchmarks'
  | 'reporting'
  | 'review'
  | 'pipelines'
  | 'models'
  | 'privacy'
  | 'risk'
  | 'billing'
  | 'settings';

class TabErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }>{
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-lg border p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">This section failed to load</h3>
          <p className="text-gray-600 mb-4">{this.state.message}</p>
          <a href="/account" className="inline-flex items-center px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Back to Overview</a>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const defaultSchema = {
  id: 'automotive_v1',
  targetVolume: 1000,
  fields: [
    { name: 'vin', type: 'string', privacyLevel: 'medium', constraints: { required: true, unique: true } },
    { name: 'model', type: 'string', privacyLevel: 'low', constraints: { required: true, unique: false } },
    { name: 'defect_score', type: 'number', privacyLevel: 'low', constraints: { required: false, unique: false } },
    { name: 'timestamp', type: 'date', privacyLevel: 'low', constraints: { required: false, unique: false } }
  ],
  privacySettings: { epsilon: 0.5, syntheticRatio: 1.0 }
} as any;

const AethergenDashboard: React.FC<AethergenDashboardProps> = ({ userEmail, onLogout }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [role, setRole] = useState<'viewer'|'developer'|'team'|'enterprise'|'admin'>('viewer');
  const [seedPresent, setSeedPresent] = useState<boolean>(false);
  const [qaMode, setQaMode] = useState<boolean>(false);
  const [showOnboard, setShowOnboard] = useState<boolean>(false);
  // Seed data wired through from uploader to generator
  const [seedData, setSeedData] = useState<any[]>([]);
  const [activeSchema, setActiveSchema] = useState<any>(defaultSchema);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Load cached role first
        const cached = localStorage.getItem(`aeg:role:${userEmail}`);
        if (cached && mounted) setRole(cached as any);

        // QA override: query param ?qa=1 sets a local flag; env VITE_QA_UNLOCK=1 or localStorage('aeg_qa')=1 => admin
        try {
          const usp = new URLSearchParams(window.location.search);
          if (usp.get('qa') === '1') localStorage.setItem('aeg_qa', '1');
        } catch {}

        const ents = await getEntitlements({ email: userEmail });
        const prices = ents.filter(e=>e.active).map(e=>e.stripe_price);
        let computed = entitlementsToRole(prices);
        // Admin override via env allowlist
        const admins = (import.meta.env.VITE_ADMIN_EMAILS as any || '').toString().split(',').map((s:string)=>s.trim().toLowerCase()).filter(Boolean);
        if (admins.includes(userEmail.toLowerCase())) {
          computed = 'admin';
        }
        // QA unlock
        const qaUnlock = (import.meta.env as any).VITE_QA_UNLOCK === '1' || localStorage.getItem('aeg_qa') === '1';
        if (mounted) {
          setQaMode(!!qaUnlock);
          if (qaUnlock) computed = 'admin';
          try { setSeedPresent(localStorage.getItem('aeg_seed_present') === '1'); } catch {}
          setRole(computed);
          try { localStorage.setItem(`aeg:role:${userEmail}`, computed); } catch {}
        }
      } catch {
        // default viewer
      }
    })();
    return () => { mounted = false; };
  }, [userEmail]);

  useEffect(() => {
    try {
      setShowOnboard(localStorage.getItem('aeg_onboard_done') !== '1');
    } catch {}
  }, []);

  const dashboardTabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3, description: 'Platform metrics and performance' },
    { id: 'schema', name: 'Schema Designer', icon: Settings, description: 'Design single or multiple schemas' },
    { id: 'pipelines', name: 'Pipelines', icon: GitBranch, description: 'Manage multi‑schema pipelines' },
    { id: 'upload', name: 'Upload / Seed', icon: Upload, description: 'Upload or generate seed (encrypted with proofs)' },
    { id: 'generate', name: 'Generate Data', icon: Database, description: 'Create synthetic datasets' },
    { id: 'clean', name: 'Clean Data', icon: Activity, description: 'Clean and prepare data' },
    { id: 'ablation', name: 'Ablation Tests', icon: Activity, description: 'Run ablation recipes and compare' },
    { id: 'benchmarks', name: 'Benchmarks', icon: LineChart, description: 'Performance and quality benchmarks' },
    { id: 'reporting', name: 'Reporting', icon: BarChart3, description: 'Reports and dashboards' },
    { id: 'review', name: 'Review', icon: BadgeCheck, description: 'Human QA sample review and report export' },
    { id: 'models', name: 'Models', icon: BadgeCheck, description: 'Model registry and lab' },
    { id: 'privacy', name: 'Privacy Metrics', icon: Shield, description: 'Privacy and compliance tools' },
    { id: 'risk', name: 'Risk Assessment', icon: Activity, description: 'Model collapse risk analysis' },
    { id: 'billing', name: 'Billing', icon: CreditCard, description: 'Subscription and usage' },
    { id: 'settings', name: 'Settings', icon: Settings, description: 'Account and platform settings' },
    ...(import.meta.env.VITE_FEATURE_MARKETPLACE === '1' ? [
      { id: 'marketplace', name: 'Marketplace', icon: GitBranch, description: 'Model rental marketplace (preview)' }
    ] : [])
  ];

  function handleSeedUploaded(data: any[], detected?: SchemaField[]) {
    if (Array.isArray(data) && data.length > 0) {
      setSeedData(data);
      setSeedPresent(true);
      try { localStorage.setItem('aeg_seed_present', '1'); } catch {}
      // Update schema fields from the detected schema so the generator uses
      // field names and types that match the actual uploaded data.
      if (detected && detected.length > 0) {
        setActiveSchema((prev: any) => ({
          ...prev,
          fields: detected.map(f => ({
            ...f,
            privacyLevel: f.privacyLevel || 'medium',
            constraints: f.constraints || { required: true, unique: false }
          }))
        }));
      }
    }
  }

  const GatePanel: React.FC<{ title: string; body: string }> = ({ title, body }) => (
    <div className="bg-white rounded-lg border p-8 text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-700 mb-6">{body}</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setActiveTab('upload')} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Upload seed</button>
        <button onClick={() => { try { localStorage.setItem('aeg_seed_present','1'); } catch {}; setSeedPresent(true); }} className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Create sample seed (200 rows)</button>
        <a href="#" onClick={(e)=>{e.preventDefault(); setActiveTab('overview');}} className="text-blue-700 underline">Learn the workflow</a>
      </div>
      {qaMode && (
        <div className="mt-3 text-sm text-amber-700">QA mode is ON. You can explore without uploading.</div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {showOnboard && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome! First‑run checklist</h3>
                    <p className="text-gray-700 mb-4">Follow these steps to get value quickly. You can revisit anytime from Settings.</p>
                  </div>
                  <button
                    className="text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => { setShowOnboard(false); try { localStorage.setItem('aeg_onboard_done','1'); } catch {} }}
                    title="Dismiss"
                  >✕</button>
                </div>
                <ol className="list-decimal ml-6 space-y-2 text-gray-800">
                  <li>
                    <button className="text-blue-700 underline" onClick={() => setActiveTab('upload')}>Upload a small seed dataset</button>
                  </li>
                  <li>
                    <button className="text-blue-700 underline" onClick={() => setActiveTab('benchmarks')}>Run Benchmarks (uses safe local stubs in QA)</button>
                  </li>
                  <li>
                    <button className="text-blue-700 underline" onClick={() => setActiveTab('reporting')}>Open Reporting dashboard</button>
                  </li>
                  <li>
                    <button className="text-blue-700 underline" onClick={() => setActiveTab('privacy')}>Review Privacy metrics</button>
                  </li>
                  <li>
                    <button className="text-blue-700 underline" onClick={() => setActiveTab('models')}>Open Libraries (Datasets/Models/Templates)</button>
                  </li>
                  <li>
                    <button className="text-blue-700 underline" onClick={() => setActiveTab('pipelines')}>Manage Pipelines / Snapshots</button>
                  </li>
                  <li>
                    <button className="text-blue-700 underline" onClick={() => setActiveTab('billing')}>Configure Billing (if eligible)</button>
                  </li>
                </ol>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">1,000,000,000+</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Generation Speed</p>
                    <p className="text-2xl font-bold text-gray-900">50K/sec</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Quality Score</p>
                    <p className="text-2xl font-bold text-gray-900">100%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">1,247</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Dataset generation completed - 1M records</span>
                  </div>
                  <span className="text-xs text-gray-500">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Schema validation passed</span>
                  </div>
                  <span className="text-xs text-gray-500">15 minutes ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">Privacy metrics updated</span>
                  </div>
                  <span className="text-xs text-gray-500">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'generate':
        return (
          <>
            {seedData.length === 0 && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 font-medium">
                  No seed data loaded yet.
                  <button onClick={() => setActiveTab('upload')} className="ml-2 underline">Upload seed data first</button>
                  {' '}or use the sample seed button on the Upload tab.
                </p>
              </div>
            )}
            <SyntheticDataGenerator
              schema={activeSchema}
              seedData={seedData}
              onGenerationComplete={() => {}}
            />
          </>
        );

      case 'schema':
        if (!roleHas(role, 'design_schema')) return <UpgradeGate feature="Schema Designer" />;
        return <SchemaDesigner />;

      case 'pipelines':
        if (!seedPresent && !qaMode) return <GatePanel title="Pipelines need data" body="Upload a seed or create a sample dataset to configure multi-schema pipelines." />;
        if (!roleHas(role, 'manage_pipelines')) return <UpgradeGate feature="Pipelines" />;
        return <PipelineManager />;

      case 'clean':
        if (!roleHas(role, 'run_privacy')) return <UpgradeGate feature="Data Cleaner" />;
        return <DataCleaner />;

      case 'privacy':
        if (!seedPresent && !qaMode) return <GatePanel title="Privacy metrics need data" body="Upload a seed or generate a sample so we can compute privacy/utility metrics." />;
        if (!roleHas(role, 'run_privacy')) return <UpgradeGate feature="Privacy Metrics" />;
        return <PrivacyMetrics />;

      case 'risk':
        if (!seedPresent && !qaMode) return <GatePanel title="Risk assessment needs data" body="Upload a seed or generate a sample to run risk analysis." />;
        if (!roleHas(role, 'view_risk')) return <UpgradeGate feature="Risk Assessment" />;
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Collapse Risk Assessment</h3>
              <ModelCollapseRiskDial />
            </div>
          </div>
        );

      case 'upload':
        return (
          <SeedDataUploader
            schema={activeSchema}
            onDataUploaded={(data, detected) => { handleSeedUploaded(data, detected); setActiveTab('generate'); }}
            onValidationComplete={() => {}}
          />
        );

      case 'benchmarks':
        if (!seedPresent && !qaMode) return <GatePanel title="Benchmarks need data" body="Upload a seed or generate a sample dataset so benchmark results reflect your schema." />;
        {
          const stubData = qaMode ? [{ vin: 'QA1', model: 'Demo', defect_score: 0.1, timestamp: new Date().toISOString() }] : [] as any[];
          return (
            <AdvancedBenchmarking
              schema={activeSchema}
              seedData={seedData.length > 0 ? seedData.slice(0, 200) : stubData}
              generatedData={stubData}
            />
          );
        }

      case 'ablation':
        return (
          <div className="bg-white rounded-lg border p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ablation moved under Benchmarks</h3>
            <p className="text-gray-700 mb-6">Use the Benchmarks tab to run ablation recipes and model comparisons.</p>
            <button onClick={() => setActiveTab('benchmarks')} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Go to Benchmarks</button>
          </div>
        );

      case 'reporting':
        if (!seedPresent && !qaMode) return <GatePanel title="Reporting needs data" body="Upload a seed or generate a sample to populate reports. No external calls are made until you confirm." />;
        // Provide safe props; in QA provide stub data
        const stubData = qaMode ? [{ vin: 'QA1', model: 'Demo', defect_score: 0.1, timestamp: new Date().toISOString() }] : [] as any[];
        return (
          <ReportingDashboard
            schema={activeSchema}
            seedData={seedData.length > 0 ? seedData.slice(0, 200) : stubData}
            generatedData={stubData}
            benchmarkResults={[]}
          />
        );

      case 'review':
        return <ReviewTab />;

      case 'models':
        return (
          <div className="space-y-6">
            <ModelsLibrary />
            <DatasetsLibrary />
            <TemplatesLibrary />
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Model Lab</h3>
              <ModelLab />
            </div>
          </div>
        );

      case 'billing':
        if (!roleHas(role, 'view_billing')) return <UpgradeGate feature="Billing" />;
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing & Usage</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Current Plan</h4>
                  <p className="text-2xl font-bold text-blue-600">Developer Hub Pro</p>
                  <p className="text-sm text-gray-600">£499/month</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Usage This Month</h4>
                  <p className="text-2xl font-bold text-gray-900">23.4M</p>
                  <p className="text-sm text-gray-600">of 50M records</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage & Quotas</h3>
              <StorageUsagePanel role={role} />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <div className="flex">
                    <input
                      type="password"
                      value="sk_live_...abc123"
                      disabled
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                    />
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700">
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'marketplace':
        if (import.meta.env.VITE_FEATURE_MARKETPLACE !== '1') return null as any;
        return <MarketplaceHome />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Aethergen Platform</h1>
            <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Beta
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              {userEmail}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white shadow-sm border-r transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="p-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <nav className="px-2">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors mb-1 ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-900 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="ml-3">{tab.name}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {!isSidebarCollapsed && (
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  {dashboardTabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="text-gray-600 mt-2">
                  {dashboardTabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
            )}
            
            <TabErrorBoundary>
            {renderTabContent()}
            </TabErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AethergenDashboard;

