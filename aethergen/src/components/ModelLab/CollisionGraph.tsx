import React from 'react';
import { EnergyLedger } from '../../types/energyLedger';

export const CollisionGraph: React.FC<{ ledger: EnergyLedger | null }> = ({ ledger }) => {
  if (!ledger || ledger.entries.length === 0) return null;
  const nodes = new Set<string>();
  const edges = ledger.entries
    .filter(e => e.type === 'collision' && e.from && e.to)
    .map(e => ({ from: e.from as string, to: e.to as string }));
  edges.forEach(e => { nodes.add(e.from); nodes.add(e.to); });
  const nodeList = Array.from(nodes);
  const spacing = 80;
  const positions = new Map<string, { x: number; y: number }>();
  nodeList.forEach((n,i)=> positions.set(n, { x: 40 + i*spacing, y: 50 }));
  return (
    <div className="rounded-xl p-3 bg-slate-900/70 border border-slate-700">
      <div className="text-slate-200 text-sm mb-2">Collision Graph</div>
      <svg width={Math.max(320, nodeList.length*spacing+40)} height={120}>
        {edges.map((e,i)=>{
          const a = positions.get(e.from!)!; const b = positions.get(e.to!)!;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#60a5fa" strokeWidth={2}/>;
        })}
        {nodeList.map((n,i)=>{
          const p = positions.get(n)!;
          return (
            <g key={n}>
              <circle cx={p.x} cy={p.y} r={10} fill="#34d399" />
              <text x={p.x+14} y={p.y+4} fill="#cbd5e1" fontSize={10}>{n.slice(0,8)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default CollisionGraph;



