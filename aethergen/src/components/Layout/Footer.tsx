import React from 'react';
import { Github, Mail, Shield, Lock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-slate-100 py-6 mt-12 relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              AethergenAI
            </h2>
            <p className="text-sm text-blue-200 italic">The Edge of Chaos and Order: Modular AI Training Pipeline</p>
            <p className="text-xs text-blue-300">Powered by AUSPEXI</p>
          </div>
          
          <div className="flex space-x-4">
            <a 
              href="https://github.com/AUSPEXI" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-yellow-400 transition-colors"
            >
              <Github className="h-6 w-6" />
            </a>
            <a 
              href="mailto:sales@auspexi.com" 
              className="text-white hover:text-yellow-400 transition-colors"
            >
              <Mail className="h-6 w-6" />
            </a>
            <div className="text-yellow-400">
              <Lock className="h-6 w-6" />
            </div>
          </div>
        </div>
        
          <div className="mt-6 pt-6 border-t border-blue-800/50 text-center text-sm text-blue-200/90">
          <p>© {new Date().getFullYear()} AUSPEXI. All rights reserved.</p>
          <p className="mt-1">
            Global Compliance • Privacy-Preserving AI • Modular Benchmarking • Quantum-Ready
          </p>
          <div className="mt-2 flex justify-center space-x-4">
            <a href="#/privacy" className="hover:text-white">Privacy Policy</a>
            <a href="#/terms" className="hover:text-white">Terms of Service</a>
            <a href="https://auspexi.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">AUSPEXI</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;