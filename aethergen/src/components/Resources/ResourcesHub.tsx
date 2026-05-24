import React, { useEffect, useState } from "react";
import { 
  BookOpen, 
  CreditCard, 
  Shield, 
  Database, 
  FileText, 
  Settings, 
  Users, 
  Zap,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Download,
  Star,
  TrendingUp,
  Globe,
  Lock,
  Award,
  Rocket
} from "lucide-react";
import PublisherOnboardingModal from "../Marketplace/PublisherOnboardingModal";

type DocKey =
  | "getting-started"
  | "platform-resources"
  | "product-pricing"
  | "technical-overview"
  | "api-reference"
  | "evidence-spec"
  | "compliance-audit"
  | "marketplace"
  | "billing-access"
  | "lm-studio"
  | "changelog"
  | "license-terms"
  | "guides-getting-started"
  | "publisher-guide";

const loaders: Record<DocKey, () => Promise<{ default: string }>> = {
  "getting-started": () => import("../../../docs/MARKETING_SAFE_SUMMARY.md?raw"),
  "platform-resources": () => import("../../../docs/MARKETING_SAFE_SUMMARY.md?raw"),
  "product-pricing": () => import("../../../docs/BILLING_AND_ACCESS.md?raw"),
  "technical-overview": () => import("../../../docs/MARKETING_SAFE_SUMMARY.md?raw"),
  "api-reference": () => import("../../../docs/API_REFERENCE.md?raw"),
  "evidence-spec": () => import("../../../docs/EVIDENCE_BUNDLE_SPEC.md?raw"),
  "compliance-audit": () => import("../../../docs/COMPLIANCE_AND_AUDIT.md?raw"),
  "marketplace": () => import("../../../docs/Package_and_list_Databricks.md?raw"),
  "billing-access": () => import("../../../docs/BILLING_AND_ACCESS.md?raw"),
  "lm-studio": () => import("../../../docs/LM_STUDIO_SETUP.md?raw"),
  "changelog": () => import("../../../docs/MARKETING_SAFE_SUMMARY.md?raw"),
  "license-terms": () => import("../../../docs/LICENSE_AND_TERMS.md?raw"),
  "guides-getting-started": () => import("../../../docs/guides/GETTING_STARTED.md?raw"),
  "publisher-guide": () => import("../../../docs/Publisher_and_Blog_Library.md?raw"),
};

const sections: Array<{ 
  title: string; 
  icon: React.ReactNode;
  items: Array<{ key: DocKey; label: string; description?: string }> 
}> = [
  {
    title: "Getting Started",
    icon: <Rocket className="w-5 h-5" />,
    items: [
      { key: "getting-started", label: "Platform Overview", description: "Complete platform overview and capabilities" },
      { key: "guides-getting-started", label: "Quickstart Guide", description: "Step-by-step getting started guide" },
      { key: "publisher-guide", label: "Publisher & Blog Library", description: "Populate library and publish to LinkedIn" },
    ],
  },
  {
    title: "Product & Pricing",
    icon: <CreditCard className="w-5 h-5" />,
    items: [
      { key: "product-pricing", label: "Pricing & Access", description: "Complete pricing structure and access control" },
      { key: "license-terms", label: "Licensing & Terms", description: "Licensing terms and legal information" },
    ],
  },
  {
    title: "Technical",
    icon: <Settings className="w-5 h-5" />,
    items: [
      { key: "technical-overview", label: "Architecture", description: "Platform architecture and technical overview" },
      { key: "api-reference", label: "API Reference", description: "Complete API documentation and endpoints" },
      { key: "evidence-spec", label: "Evidence Bundle Spec", description: "Evidence bundle specification and format" },
    ],
  },
  {
    title: "Compliance",
    icon: <Shield className="w-5 h-5" />,
    items: [
      { key: "compliance-audit", label: "Compliance & Audit", description: "Compliance requirements and audit procedures" },
    ],
  },
  {
    title: "Databricks",
    icon: <Database className="w-5 h-5" />,
    items: [
      { key: "marketplace", label: "Marketplace Publisher", description: "Databricks marketplace publishing guide" },
    ],
  },
  {
    title: "Platform",
    icon: <Zap className="w-5 h-5" />,
    items: [
      { key: "billing-access", label: "Billing & Access", description: "Billing configuration and access control" },
      { key: "lm-studio", label: "LM Studio Setup", description: "Local LLM provider setup guide" },
      { key: "changelog", label: "Changelog", description: "Platform updates and feature releases" },
    ],
  },
];

// Helper function to parse markdown headers and create navigation
const parseMarkdownHeaders = (content: string) => {
  const lines = content.split('\n');
  const headers: Array<{ level: number; text: string; id: string }> = [];
  
  lines.forEach(line => {
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headers.push({ level, text, id });
    }
  });
  
  return headers;
};

// Helper function to render markdown content as styled HTML
const renderMarkdownContent = (content: string) => {
  const lines = content.split('\n');
  const renderedLines: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  
  const flushList = () => {
    if (listItems.length > 0) {
      renderedLines.push(
        <ul key={`list-${renderedLines.length}`} className="mb-6 space-y-2">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };
  
  lines.forEach((line, index) => {
    // Headers
    if (line.startsWith('#')) {
      flushList();
      const level = line.match(/^#+/)?.[0].length || 1;
      const text = line.replace(/^#+\s+/, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
      const className = level === 1 ? 'text-4xl font-bold text-white mb-6' :
                       level === 2 ? 'text-3xl font-bold text-blue-100 mb-5 mt-8' :
                       level === 3 ? 'text-2xl font-semibold text-blue-200 mb-4 mt-6' :
                       level === 4 ? 'text-xl font-semibold text-blue-300 mb-3 mt-5' :
                       'text-lg font-medium text-blue-300 mb-2 mt-4';
      
      renderedLines.push(
        <HeaderTag key={index} id={id} className={className}>
          {text}
        </HeaderTag>
      );
    }
    // Lists
    else if (line.match(/^[-*+]\s+/)) {
      const text = line.replace(/^[-*+]\s+/, '');
      listItems.push(
        <li key={listItems.length} className="text-blue-100 flex items-start">
          <span className="text-blue-400 mr-2 mt-1">•</span>
          <span>{text}</span>
        </li>
      );
      inList = true;
    }
    // Numbered lists
    else if (line.match(/^\d+\.\s+/)) {
      const text = line.replace(/^\d+\.\s+/, '');
      listItems.push(
        <li key={listItems.length} className="text-blue-100 flex items-start">
          <span className="text-blue-400 mr-2 mt-1 font-mono">{listItems.length + 1}.</span>
          <span>{text}</span>
        </li>
      );
      inList = true;
    }
    // Bold text (remove asterisks and render as regular text)
    else if (line.includes('**')) {
      flushList();
      const cleanText = line.replace(/\*\*/g, ''); // Remove all asterisks
      renderedLines.push(
        <p key={index} className="text-blue-100 mb-4 leading-relaxed">
          {cleanText}
        </p>
      );
    }
    // Code blocks
    else if (line.startsWith('```')) {
      flushList();
      // Simple code block handling - could be enhanced
      renderedLines.push(
        <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
          <code className="text-blue-200 font-mono text-sm">{line.replace('```', '')}</code>
        </div>
      );
    }
    // Regular paragraphs
    else if (line.trim()) {
      flushList();
      renderedLines.push(
        <p key={index} className="text-blue-100 mb-4 leading-relaxed">
          {line}
        </p>
      );
    }
    // Empty lines
    else {
      flushList();
      renderedLines.push(<div key={index} className="h-4" />);
    }
  });
  
  // Flush any remaining list items
  flushList();
  
  return renderedLines;
};

const ResourcesHub: React.FC = () => {
  const [active, setActive] = useState<DocKey>("getting-started");
  const [content, setContent] = useState<string>("Loading…");
  const [error, setError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<Array<{ level: number; text: string; id: string }>>([]);
  const [publisherOpen, setPublisherOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(null);
        setContent("Loading…");
        const mod = await loaders[active]();
        if (mounted) {
          setContent(mod.default);
          setHeaders(parseMarkdownHeaders(mod.default));
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load content");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [active]);

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="sticky top-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-200 mb-2">Documentation</h3>
                <p className="text-sm text-blue-100">Navigate through our comprehensive resources</p>
              </div>
              
              {sections.map((sec) => (
                <div key={sec.title} className="mb-6">
                  <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-blue-300 mb-3 font-medium">
                    {sec.icon}
                    {sec.title}
                  </div>
                  <ul className="space-y-2">
                    {sec.items.map((it) => (
                      <li key={it.key}>
                        <button
                          onClick={() => setActive(it.key)}
                          className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                            active === it.key 
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                              : "text-blue-100 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className="font-medium">{it.label}</div>
                          {it.description && (
                            <div className={`text-xs mt-1 ${
                              active === it.key ? 'text-blue-100' : 'text-blue-200'
                            }`}>
                              {it.description}
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="col-span-12 md:col-span-8 lg:col-span-9">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-white">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setPublisherOpen(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                Publish to Databricks
              </button>
            </div>
            {error ? (
              <div className="text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Error loading content: {error}
                </div>
              </div>
            ) : content === "Loading…" ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                {/* Table of Contents */}
                {headers.length > 0 && (
                  <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-xl">
                    <h4 className="text-lg font-semibold text-blue-200 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Table of Contents
                    </h4>
                    <nav className="space-y-2">
                      {headers.map((header, index) => (
                        <a
                          key={index}
                          href={`#${header.id}`}
                          className={`block text-sm transition-colors duration-200 ${
                            header.level === 1 ? 'text-blue-100 font-medium' :
                            header.level === 2 ? 'text-blue-200 ml-4' :
                            'text-blue-300 ml-8'
                          } hover:text-white`}
                        >
                          {header.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                )}
                
                {/* Rendered Content */}
                <div className="space-y-6">
                  {renderMarkdownContent(content)}
                </div>
              </div>
            )}
          </div>
          <PublisherOnboardingModal open={publisherOpen} onClose={() => setPublisherOpen(false)} />
        </main>
      </div>
    </div>
  );
};

export default ResourcesHub;


