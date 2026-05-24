import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import GlobalCtaRibbon from './components/GlobalCtaRibbon';
import Home from './pages/Home';
import About from './pages/About';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import Technology from './pages/Technology';
import Roadmap from './pages/Roadmap';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Press from './pages/Press';
import { Resources } from './pages/Resources';
import HeroArt from './pages/HeroArt';
import Funding from './pages/Funding';
import AuthPage from './components/Auth/AuthPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import DPA from './pages/DPA';
import Subprocessors from './pages/Subprocessors';
const ManifoldPrototypeLazy = React.lazy(() => import('./pages/ManifoldPrototype'));
import ManifoldExplainer from './pages/ManifoldExplainer';
import ResourcesLLMIndexing from './pages/ResourcesLLMIndexing';
import ResourcesLLMBenchmarks from './pages/ResourcesLLMBenchmarks';
import ResourcesVisibilityScore from './pages/ResourcesVisibilityScore';
import AI from './pages/AI';
import Whitepaper from './pages/Whitepaper';
import ZeroTrustCalibration from './pages/ZeroTrustCalibration';
import ContextEngineering from './pages/ContextEngineering';
import ModelStarters from './pages/ModelStarters';
import StarterDetail from './pages/StarterDetail';
import ChooseModel from './pages/ChooseModel';
import NycTaxiEval from './pages/NycTaxiEval';
import Publisher from './pages/Publisher';
import BlogManager from './pages/BlogManager';
import { AirGappedDemo } from './pages/AirGappedDemo';
import { AutomotiveDemo } from './pages/AutomotiveDemo';
import { MarketplaceDemo } from './pages/MarketplaceDemo';
import { CardsDemo } from './pages/CardsDemo';
import { StabilityDemo } from './pages/StabilityDemo'
import { Features } from './pages/Features'
import Dashboard from './pages/Dashboard'
import Investors from './pages/Investors'
import Pilot from './pages/Pilot'
import { EfficiencyDemo } from './pages/EfficiencyDemo'
import { FinancialCrimeDemo } from './pages/FinancialCrimeDemo'
import { Docs } from './pages/Docs'
import { DocsCIEvidence } from './pages/DocsCIEvidence'
import { DocsDemos } from './pages/DocsDemos'
import SwarmSafetyDemo from './pages/SwarmSafetyDemo'
import InsuranceFraudDemo from './pages/InsuranceFraudDemo'
import SafetyNotice from './pages/SafetyNotice'
import MetricsDemo from './pages/MetricsDemo'
import ContextStudio from './pages/ContextStudio'
import ABExperiment from './pages/ABExperiment'
import ContextDashboard from './pages/ContextDashboard'

import Footer from './components/Footer';

// Component to handle scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function RoutedApp() {
  const { pathname } = useLocation();
  const hideChrome = pathname.startsWith('/account');
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ScrollToTop />
      {!hideChrome && <Navigation />}
      {!hideChrome && <GlobalCtaRibbon />}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/funding" element={<Funding />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/hero-art" element={<HeroArt />} />
          <Route path="/press" element={<Press />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/account" element={<AuthPage />} />
          <Route path="/account/dashboard" element={<Dashboard />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/pilot" element={<Pilot />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/dpa" element={<DPA />} />
          <Route path="/subprocessors" element={<Subprocessors />} />
          <Route path="/manifold-prototype" element={<Suspense fallback={<div className="p-8 text-center">Loading…</div>}><ManifoldPrototypeLazy /></Suspense>} />
          <Route path="/manifold-explainer" element={<ManifoldExplainer />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/resources/llm-indexing" element={<ResourcesLLMIndexing />} />
          <Route path="/resources/llm-benchmarks" element={<ResourcesLLMBenchmarks />} />
          <Route path="/resources/visibility-score" element={<ResourcesVisibilityScore />} />
          <Route path="/whitepaper" element={<Whitepaper />} />
          <Route path="/zero-trust-calibration" element={<ZeroTrustCalibration />} />
          <Route path="/context-engineering" element={<ContextEngineering />} />
          <Route path="/build" element={<ModelStarters />} />
          <Route path="/starter/:type" element={<StarterDetail />} />
          <Route path="/choose-model" element={<ChooseModel />} />
          <Route path="/experiments/nyc-taxi-eval" element={<NycTaxiEval />} />
                                  <Route path="/publisher" element={<Publisher />} />
                        <Route path="/blog-manager" element={<BlogManager />} />
                        <Route path="/air-gapped-demo" element={<AirGappedDemo />} />
                        <Route path="/automotive-demo" element={<AutomotiveDemo />} />
                        <Route path="/marketplace-demo" element={<MarketplaceDemo />} />
                        <Route path="/cards-demo" element={<CardsDemo />} />
                        <Route path="/stability-demo" element={<StabilityDemo />} />
                        <Route path="/features" element={<Features />} />
                        {/* duplicate /resources route removed */}
                        <Route path="/efficiency-demo" element={<EfficiencyDemo />} />
                        <Route path="/financial-crime-demo" element={<FinancialCrimeDemo />} />
                        <Route path="/docs" element={<Docs />} />
                        <Route path="/docs/ci-evidence" element={<DocsCIEvidence />} />
                        <Route path="/docs/demos" element={<DocsDemos />} />
                        <Route path="/swarm-safety-demo" element={<SwarmSafetyDemo />} />
                        <Route path="/insurance-fraud-demo" element={<InsuranceFraudDemo />} />
                        <Route path="/safety" element={<SafetyNotice />} />
                        <Route path="/metrics-demo" element={<MetricsDemo />} />
                        <Route path="/context-studio" element={<ContextStudio />} />
                        <Route path="/ab-experiment" element={<ABExperiment />} />
                        <Route path="/context-dashboard" element={<ContextDashboard />} />
        </Routes>
      </div>
      {!hideChrome && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <RoutedApp />
    </Router>
  );
}

export default App;
