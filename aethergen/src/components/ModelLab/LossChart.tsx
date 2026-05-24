import React from 'react';

export const LossChart: React.FC<{ history: number[] | null }> = ({ history }) => {
  if (!history || history.length < 2) return null;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const points = history.map((v, i) => {
    const x = (i / (history.length - 1)) * 300;
    const y = 80 - ((v - min) / (max - min + 1e-9)) * 80;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="rounded-xl p-3 bg-slate-900/70 border border-slate-700">
      <div className="text-slate-200 text-sm mb-2">AE Loss</div>
      <svg width={320} height={100}>
        <polyline points={points} fill="none" stroke="#34d399" strokeWidth={2} />
      </svg>
    </div>
  );
};

export default LossChart;



