import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PressHero from './PressHero';
import PressKitBuilder from './PressKitBuilder';
import FoundersStory from './FoundersStory';
import FounderImages from './FounderImages';

interface PressSectionProps {
  onContact: () => void;
}

const PressSection: React.FC<PressSectionProps> = ({ onContact }) => {
  const [currentSection, setCurrentSection] = useState<'hero' | 'kit-builder' | 'founders-story' | 'founder-images' | 'gallery' | 'contact'>('hero');
  const [selectedKit, setSelectedKit] = useState<any>(null);

  const navigationItems = [
    { id: 'hero', label: 'World Record', icon: '🏆' },
    { id: 'kit-builder', label: 'Press Kit Builder', icon: '📋' },
    { id: 'founders-story', label: "Founder's Story", icon: '👨‍💼' },
    { id: 'founder-images', label: 'Visual Journey', icon: '📸' },
    { id: 'gallery', label: 'Media Gallery', icon: '🎨' },
    { id: 'contact', label: 'Contact', icon: '📞' }
  ];

  const handleNavigation = (section: string) => {
    setCurrentSection(section as any);
  };

  const handleContactPress = () => {
    onContact();
  };

  const handleDownloadPress = () => {
    setCurrentSection('kit-builder');
  };

  const handleKitDownload = (kit: any) => {
    setSelectedKit(kit);
    // Here you would implement the actual download logic
    console.log('Downloading kit for:', kit.audience);
    
    // Simulate download
    setTimeout(() => {
      alert(`Press kit for ${kit.audience} downloaded successfully!`);
    }, 1000);
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'hero':
        return (
          <PressHero
            onContactPress={handleContactPress}
            onDownloadPress={handleDownloadPress}
          />
        );
      case 'kit-builder':
        return (
          <PressKitBuilder
            onDownload={handleKitDownload}
          />
        );
      case 'founders-story':
        return (
          <FoundersStory
            onContact={onContact}
          />
        );
      case 'founder-images':
        return (
          <FounderImages
            onContact={onContact}
          />
        );
      case 'gallery':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-20">
            <div className="container mx-auto px-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                  Media Gallery
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
                  High-resolution assets, screenshots, and visual materials for media use.
                </p>
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <p className="text-gray-600 text-lg">
                    Media Gallery will include company logos, 
                    platform screenshots, performance charts, and executive photos.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-20">
            <div className="container mx-auto px-4 text-center">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
                  Contact & Inquiries
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
                  Get in touch with our media relations team for interviews, demos, and partnerships.
                </p>
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <p className="text-gray-600 text-lg mb-6">
                    Ready to discuss how Auspexi's breakthrough technology can benefit your organization?
                  </p>
                  <button
                    onClick={onContact}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    📞 Contact Us Now
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-lg"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏆</span>
              <span className="text-xl font-bold text-gray-800">Auspexi Press</span>
            </div>
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    currentSection === item.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setCurrentSection('hero')}
                className="text-gray-600 hover:text-blue-600"
              >
                <span className="text-2xl">🏆</span>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around py-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
                currentSection === item.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="pt-20">
        {renderSection()}
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="bg-slate-900 text-white py-12"
      >
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">Auspexi - Global Leader in Synthetic Data</h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              First company to generate 1 BILLION synthetic records while maintaining 100% quality compliance. 
              Revolutionizing the $50B+ synthetic data market.
            </p>
          </div>
          <div className="flex justify-center space-x-6 mb-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Website
            </a>
          </div>
          <div className="text-gray-500 text-sm">
            © 2025 Auspexi. All rights reserved. World Record Achievement: August 15, 2025.
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default PressSection;
