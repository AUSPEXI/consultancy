import React from 'react';
import { Lock } from 'lucide-react';

const UpgradeGate: React.FC<{ feature: string }> = ({ feature }) => {
  return (
    <div className="bg-white rounded-lg border p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-4">
        <Lock className="w-6 h-6 text-amber-700" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature} is not available on your plan</h3>
      <p className="text-gray-600 mb-6">Upgrade to Team or Enterprise to unlock this feature.</p>
      <a href="/pricing" className="inline-flex items-center px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">View Plans</a>
    </div>
  );
};

export default UpgradeGate;



