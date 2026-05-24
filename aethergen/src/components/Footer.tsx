import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Rocket, Globe, CheckCircle } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Company Info */}
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-2xl font-bold text-white mb-4">Auspexi</h3>
          <p className="text-blue-100 mb-4">
            Demonstration: 1 BILLION synthetic records generated; outcomes validated via evidence bundles. 
            Evidence‑led synthetic data platform with streaming generation and Databricks workflows.
          </p>
          
          {/* Key Achievements */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">1B+</div>
              <div className="text-xs text-blue-200">Records Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">11</div>
              <div className="text-xs text-blue-200">Inventions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">Evidence</div>
              <div className="text-xs text-blue-200">Quality Metrics</div>
            </div>
          </div>
          
          <div className="text-blue-200 text-sm">
            <p>Surrey, United Kingdom</p>
            <p>sales@auspexi.com</p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/about" className="text-blue-200 hover:text-white transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/technology" className="text-blue-200 hover:text-white transition-colors">
                Technology
              </Link>
            </li>
            <li>
              <Link to="/roadmap" className="text-blue-200 hover:text-white transition-colors">
                Roadmap
              </Link>
            </li>
            <li>
              <Link to="/data-suites" className="text-blue-200 hover:text-white transition-colors">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/whitepaper" className="text-blue-200 hover:text-white transition-colors">
                Whitepaper
              </Link>
            </li>
            <li>
              <Link to="/press" className="text-blue-200 hover:text-white transition-colors">
                Press
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-blue-200 hover:text-white transition-colors">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Innovation & Story */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Innovation & Story</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/press" className="text-blue-200 hover:text-white transition-colors flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Press Kit
              </Link>
            </li>
            <li>
              <Link to="/ai" className="text-blue-200 hover:text-white transition-colors flex items-center">
                <Rocket className="h-4 w-4 mr-2" />
                AI Communication
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-blue-200 hover:text-white transition-colors flex items-center">
                <Globe className="h-4 w-4 mr-2" />
                Phoenix Rising Story
              </Link>
            </li>
            <li>
              <Link to="/roadmap" className="text-blue-200 hover:text-white transition-colors flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mission Complete
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-blue-800 mt-8 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-blue-200 text-sm mb-4 md:mb-0">
            © 2025 Auspexi. All rights reserved. Evidence‑led synthetic data platform.
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-blue-200 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-blue-200 hover:text-white transition-colors text-sm">
              Terms of Use
            </Link>
            <Link to="/dpa" className="text-blue-200 hover:text-white transition-colors text-sm">
              DPA
            </Link>
            <Link to="/subprocessors" className="text-blue-200 hover:text-white transition-colors text-sm">
              Subprocessors
            </Link>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;