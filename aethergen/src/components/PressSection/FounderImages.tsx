import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FounderImagesProps {
  onContact: () => void;
}

const FounderImages: React.FC<FounderImagesProps> = ({ onContact }) => {
  const [selectedImage, setSelectedImage] = useState<number>(0);

  const founderImages = [
    {
      id: 1,
      title: "The Business Leader",
      subtitle: "Confident, Warm, Approachable",
      description: "Professional headshot showing the confident leader who emerged from adversity.",
      category: "Leadership",
      icon: "👔"
    },
    {
      id: 2,
      title: "The Physical Transformation",
      subtitle: "Muscular Build from Hard Work",
      description: "Garden flexing photo showing physical transformation from 2+ years of gardening.",
      category: "Resilience",
      icon: "💪"
    },
    {
      id: 3,
      title: "The Deep Reflection",
      subtitle: "Contemplative and Determined",
      description: "Garden contemplation showing mental toughness and determination.",
      category: "Determination",
      icon: "🧠"
    },
    {
      id: 4,
      title: "The Daily Grind",
      subtitle: "Professional Leaf Blower, 10-Hour Days",
      description: "Professional gardening equipment showing daily reality of 120-hour weeks.",
      category: "Dedication",
      icon: "🌱"
    }
  ];

  const currentImage = founderImages[selectedImage];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
            The Visual Journey
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            From business professional to manual laborer to tech revolutionary.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {founderImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              onClick={() => setSelectedImage(index)}
              className={`cursor-pointer group ${
                selectedImage === index ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-6xl mb-4">{image.icon}</div>
                    <div className="text-lg font-semibold text-gray-800 mb-2">
                      {image.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {image.subtitle}
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {image.category}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-6">{currentImage.icon}</div>
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    {currentImage.title}
                  </div>
                  <div className="text-gray-600">
                    {currentImage.subtitle}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold mb-4 text-gray-800">
                  {currentImage.title}
                </h3>
                <h4 className="text-xl font-semibold mb-4 text-blue-600">
                  {currentImage.subtitle}
                </h4>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  {currentImage.description}
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h5 className="text-lg font-semibold mb-3 text-blue-800">
                  Story Connection
                </h5>
                <p className="text-blue-700 leading-relaxed">
                  This image represents a key moment in the Phoenix Rising journey - from adversity to triumph.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold mb-8 text-gray-800">
            Ready to Meet the Founder Behind This Story?
          </h3>
          <button
            onClick={onContact}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            📞 Contact the Founder
          </button>
        </div>
      </div>
    </div>
  );
};

export default FounderImages;
