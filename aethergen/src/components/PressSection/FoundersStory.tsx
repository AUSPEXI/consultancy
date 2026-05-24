import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, MapPin, TrendingDown, Leaf, Rocket } from 'lucide-react';

interface FoundersStoryProps {
  onContact: () => void;
}

const FoundersStory: React.FC<FoundersStoryProps> = ({ onContact }) => {
  const [currentChapter, setCurrentChapter] = useState<number>(0);

  const storyChapters = [
    {
      title: "The Fall",
      subtitle: "25 Years, Then Everything Changed",
      description: "After a quarter-century relationship and business partnership ended, I needed time to rebuild. The universe had other plans.",
      image: "/1000001104 (1).jpg",
      icon: Calendar,
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      details: [
        "25-year relationship and business partnership ending",
        "Need for complete personal and professional reset",
        "Decision to step away and find myself again"
      ]
    },
    {
      title: "The Recovery",
      subtitle: "3 Years in Cairo, Finding Myself",
      description: "I moved to Cairo, Egypt for three years. Semi-retired, helping a Norwegian friend with digital marketing, and piecing back the parts of me I had compromised away.",
      image: "/1000000845.jpg",
      icon: MapPin,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      details: [
        "3 years living in Cairo, Egypt",
        "Semi-retired lifestyle in affordable country",
        "Helping Norwegian friend with digital marketing",
        "Personal healing and self-discovery journey"
      ]
    },
         {
       title: "The Descent",
       subtitle: "Crypto Madness and Everything Lost",
       description: "I went crazy with crypto trading. When the market crashed, I tried to recoup losses with futures trading. In 3 days, I lost everything.",
       image: "/1000000814.jpg",
       icon: TrendingDown,
       color: "text-orange-400",
       bgColor: "bg-orange-500/20",
       details: [
         "Aggressive cryptocurrency trading strategy",
         "Market crash and temporary portfolio devastation",
         "Futures trading attempt to recoup losses",
         "Complete financial loss in just 3 days",
         "Rock bottom financial situation"
       ]
     },
    {
      title: "The Grind",
      subtitle: "10 Hours Gardening + 120 Hours Building",
      description: "I had just enough for a flight back to the UK. For over two years, I worked 10 hours a day gardening, then came home and worked on Auspexi for another 10+ hours. 120-hour weeks without complaint.",
      image: "/20250702_153729.jpg",
      icon: Leaf,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      details: [
        "Return to UK with only flight money left",
        "2+ years of 10-hour daily gardening work",
        "120-hour work weeks building Auspexi",
        "Physical transformation and mental toughness",
        "Facing injuries and pain without complaint"
      ]
    },
         {
       title: "The Rise",
       subtitle: "Love, 1 Billion Records, Global Leadership",
       description: "I met my future wife and got engaged. Today, I've given up gardening and am leading a tech revolution through synthetic data. I've invented 11 proprietary inventions and reinvented the wheel. Now it's time to get capital, support, customers, and show the world what I can do.",
       image: "/1000001104 (1).jpg",
       icon: Rocket,
       color: "text-purple-400",
       bgColor: "bg-purple-500/20",
       details: [
         "Meeting future wife and getting engaged",
         "1 BILLION synthetic records generated",
         "11 proprietary inventions developed",
         "Global leadership in synthetic data",
         "Ready for capital and expansion"
       ]
     },
     {
       title: "The Quiet Constant",
       subtitle: "Support That Made The Build Possible",
       description: "Nine months of 120‑hour weeks isn’t a solo performance. Nicola’s steady, practical support kept me healthy, focused, and able to deliver when it mattered.",
       image: "/images/support.jpg",
       icon: Leaf,
       color: "text-blue-400",
       bgColor: "bg-blue-500/20",
       details: [
         "Healthy meals and routine during intense build phases",
         "Calm perspective when buried in edge cases",
         "Absorbing frustration so the work could continue",
         "A quiet runway to ship reliably"
       ]
     }
  ];

  const handleChapterChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentChapter < storyChapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
    } else if (direction === 'prev' && currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  const currentStory = storyChapters[currentChapter];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            THE FOUNDER'S STORY
          </h1>
          <h2 className="text-3xl md:text-5xl font-semibold mb-8 text-gray-200">
            From 10-Hour Gardening Days to 1 Billion Synthetic Records
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            The most unlikely tech success story in history. A 48-year-old autistic self-learner 
            who worked 120-hour weeks while gardening, building a company that would revolutionize synthetic data.
          </p>
        </motion.div>

        {/* Stepper Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          <div className="flex items-center justify-between">
            {storyChapters.map((chapter, index) => (
              <div key={index} className="flex flex-col items-center">
                <button
                  onClick={() => setCurrentChapter(index)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 mb-3 ${
                    index <= currentChapter 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white/20 text-white/60 hover:bg-white/30'
                  }`}
                >
                  <chapter.icon className="w-6 h-6" />
                </button>
                <div className={`text-xs text-center max-w-20 ${
                  index <= currentChapter ? 'text-blue-400' : 'text-white/60'
                }`}>
                  {chapter.title}
                </div>
                {index < storyChapters.length - 1 && (
                  <div className={`w-16 h-0.5 mt-3 ${
                    index < currentChapter ? 'bg-blue-500' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Current Chapter Content */}
        <motion.div
          key={currentChapter}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Story Content */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${currentStory.bgColor} mb-6`}>
                  <currentStory.icon className={`w-8 h-8 ${currentStory.color}`} />
                </div>
                <h3 className="text-4xl md:text-5xl font-bold mb-4 text-blue-400">
                  {currentStory.title}
                </h3>
                <h4 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-300">
                  {currentStory.subtitle}
                </h4>
                <p className="text-xl text-gray-300 leading-relaxed mb-8">
                  {currentStory.description}
                </p>
              </div>

              {/* Chapter Details */}
              <div className="space-y-3">
                {currentStory.details.map((detail, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center p-3 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20"
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    <span className="text-gray-200">{detail}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Story Image */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <img 
                    src={currentStory.image} 
                    alt={currentStory.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center mt-4">
                  <p className="text-gray-300 text-lg">
                    Chapter {currentChapter + 1} of {storyChapters.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Controls */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center items-center space-x-6 mt-16"
        >
          <button
            onClick={() => handleChapterChange('prev')}
            disabled={currentChapter === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              currentChapter === 0
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {currentChapter + 1} / {storyChapters.length}
            </div>
            <div className="text-sm text-gray-400">Chapter Progress</div>
          </div>

          <button
            onClick={() => handleChapterChange('next')}
            disabled={currentChapter === storyChapters.length - 1}
            className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              currentChapter === storyChapters.length - 1
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-20"
        >
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Meet the Founder Behind This Story?
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect with me to discuss partnerships, investments, or simply to learn more about this incredible journey.
          </p>
          <button
            onClick={onContact}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-2xl"
          >
            Let's Connect
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default FoundersStory;
