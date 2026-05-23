import React from 'react';
import { motion } from 'framer-motion';

interface PressHeroProps {
  onDownloadPress?: () => void;
  onContactPress?: () => void;
}

const PressHero: React.FC<PressHeroProps> = ({ onDownloadPress, onContactPress }) => {
  const scrollToPressKitBuilder = () => {
    const pressKitSection = document.querySelector('[data-section="press-kit-builder"]');
    if (pressKitSection) {
      pressKitSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const worldRecordMetrics = [
    {
      label: 'Records Generated',
      value: '1 BILLION',
      description: 'Synthetic data at unlimited scale'
    },
    {
      label: 'Quality Compliance',
      value: '100%',
      description: 'Maintained across all scales'
    },
    {
      label: 'Generation Speed',
      value: '50,000+',
      description: 'Records per second'
    },
    {
      label: 'Memory Efficiency',
      value: '185MB',
      description: 'Peak usage at 1B records'
    }
  ];

  const achievementTimeline = [
    {
      date: 'December 2024',
      event: 'Company Founded',
      description: 'Vision for unlimited-scale synthetic data'
    },
    {
      date: 'August 15, 2025',
      event: 'World Record Achieved',
      description: '1 BILLION synthetic records generated'
    },
    {
      date: 'Present',
      event: 'Global Leadership',
      description: 'Industry standard-bearer'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            WORLD RECORD
          </h1>
          <h2 className="text-3xl md:text-5xl font-semibold mb-8 text-gray-200">
            First Company to Generate 1 BILLION Synthetic Records
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Auspexi has achieved what was previously considered impossible in the synthetic data industry. 
            This breakthrough represents a fundamental shift in the $50B+ synthetic data market.
          </p>
        </motion.div>

        {/* World Record Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {worldRecordMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                  {metric.value}
                </div>
                <div className="text-lg font-semibold mb-2 text-white">
                  {metric.label}
                </div>
                <div className="text-sm text-gray-300">
                  {metric.description}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Achievement Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-center mb-12 text-white">
            The Journey to World Record
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievementTimeline.map((milestone, index) => (
              <motion.div
                key={milestone.date}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.2 }}
                className="text-center"
              >
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {milestone.date}
                  </div>
                  <div className="text-xl font-semibold mb-2 text-white">
                    {milestone.event}
                  </div>
                  <div className="text-gray-300">
                    {milestone.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={scrollToPressKitBuilder}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              🎯 View Press Pack Builder
            </button>
            <button
              onClick={onContactPress}
              className="bg-white/10 backdrop-blur-lg hover:bg-white/20 text-white font-bold py-4 px-8 rounded-full text-lg border border-white/30 transition-all duration-300 hover:scale-105"
            >
              📞 Contact Media Relations
            </button>
          </div>
          <p className="text-gray-400 mt-6 text-sm">
            Customize your press materials by audience type • Response within 24 hours
          </p>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-40 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotate: [0, 3, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-40 left-20 w-20 h-20 bg-pink-500/20 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
};

export default PressHero;
