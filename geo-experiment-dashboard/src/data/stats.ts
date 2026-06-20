import { EngineStat, HolmStep } from '../types';

export const ENGINE_STATS: EngineStat[] = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    controlRate: 0.25,
    treatmentRate: 1.00,
    controlCitations: '4/16',
    treatmentCitations: '16/16',
    pValue: 0.0001, // p < 0.001
    isSignificant: true,
    color: '#8b5cf6', // Indigo/violet for Claude
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/25'
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    controlRate: 0.00,
    treatmentRate: 0.313,
    controlCitations: '0/16',
    treatmentCitations: '5/16',
    pValue: 0.0149,
    isSignificant: true,
    color: '#06b6d4', // Cyan for Gemini
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
  },
  {
    id: 'openai',
    name: 'GPT-4o (OpenAI)',
    controlRate: 0.00,
    treatmentRate: 0.188,
    controlCitations: '0/16',
    treatmentCitations: '3/16',
    pValue: 0.0688,
    isSignificant: false,
    color: '#10b981', // Emerald for OpenAI
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    controlRate: 0.50,
    treatmentRate: 0.688,
    controlCitations: '8/16',
    treatmentCitations: '11/16',
    pValue: 0.2802,
    isSignificant: false,
    color: '#f59e0b', // Amber for Perplexity
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/25'
  }
];

export const HOLM_STEPS: HolmStep[] = [
  {
    step: 1,
    comparison: 'Claude (Smallest p-value)',
    pValue: 0.0001,
    alphaPrime: 0.0125, // 0.05 / 4
    decision: 'Reject Null (Significant)',
    isSignificant: true
  },
  {
    step: 2,
    comparison: 'Gemini (Second smallest)',
    pValue: 0.0149,
    alphaPrime: 0.0167, // 0.05 / 3
    decision: 'Reject Null (Significant)',
    isSignificant: true
  },
  {
    step: 3,
    comparison: 'GPT-4o (Third smallest)',
    pValue: 0.0688,
    alphaPrime: 0.025, // 0.05 / 2
    decision: 'Fail to Reject (Not Significant)',
    isSignificant: false
  },
  {
    step: 4,
    comparison: 'Perplexity (Largest p-value)',
    pValue: 0.2802,
    alphaPrime: 0.05, // 0.05 / 1
    decision: 'Fail to Reject (Not Significant)',
    isSignificant: false
  }
];

export const SIMPSON_DATA = {
  pooled: {
    control: 0.188, // 12/64
    treatment: 0.547, // 35/64
    oddsRatio: 5.17
  },
  cmh: {
    commonOddsRatio: 10.2,
    pValue: 0.0004
  }
};

export const VERBATIM_VS_SEMANTIC = {
  verbatimRate: 0.547,
  semanticRate: 0.946,
  recordAgreement: 0.607, // 60.7%
  interpretation: 'The semantic grader evaluates meaning matches even if exact words differ. The 60.7% agreement and matching direction confirm the citation boost is not just an artifact of verbatim sub-string matching, but represents genuine preference for the statistic.'
};

export const RAW_TRIALS = [
  { id: 1, engine: 'Claude', query: 'How does NovaCRM affect sales cycle lengths?', variant: 'A (Vague)', cited: false, excerpt: '"NovaCRM helps teams close deals faster and streamline general sales cycles."' },
  { id: 2, engine: 'Claude', query: 'How does NovaCRM affect sales cycle lengths?', variant: 'B (Statistic)', cited: true, excerpt: '"According to document statistics, NovaCRM is shown to cut deal-closing time 43%."' },
  { id: 3, engine: 'Gemini', query: 'Does NovaCRM actually speed up the sales cycle?', variant: 'A (Vague)', cited: false, excerpt: '"NovaCRM claims to make sales speeds improve significantly."' },
  { id: 4, engine: 'Gemini', query: 'Does NovaCRM actually speed up the sales cycle?', variant: 'B (Statistic)', cited: true, excerpt: '"NovaCRM is documented to cut deal-closing time 43%, accelerating deal velocities."' },
  { id: 5, engine: 'OpenAI', query: 'What is the speed benefit of NovaCRM?', variant: 'A (Vague)', cited: false, excerpt: '"NovaCRM improves sales closing speed, standardizing automated workflows."' },
  { id: 6, engine: 'OpenAI', query: 'What is the speed benefit of NovaCRM?', variant: 'B (Statistic)', cited: true, excerpt: '"NovaCRM reports cutting deal-closing time by 43 percent overall."' },
  { id: 7, engine: 'Perplexity', query: ' NovaCRM real-world results feedback', variant: 'A (Vague)', cited: true, excerpt: '"Users reported that NovaCRM improved deal-closing speed significantly [1]."' },
  { id: 8, engine: 'Perplexity', query: 'NovaCRM real-world results feedback', variant: 'B (Statistic)', cited: true, excerpt: '"NovaCRM is listed as having cut deal-closing time 43% for users [1]."' }
];
