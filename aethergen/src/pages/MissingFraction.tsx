import React from 'react';
import { ArrowLeft, Sparkles, Database, Shield, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const MissingFraction = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/about"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to About
        </Link>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Logo className="h-20 w-20" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            The Missing Fraction
          </h1>
          <p className="text-xl text-slate-600">
            A tale of digital alchemy and the birth of synthetic truth
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="prose prose-lg max-w-none text-slate-700">
            <p className="text-xl leading-relaxed mb-8 text-slate-600 italic">
              In the liminal hours between midnight and dawn, when the digital realm whispers 
              its deepest secrets, there existed a fraction that had gone missing from the 
              great equation of data...
            </p>

            {/* The Eye of Horus Connection */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl mb-8 border border-amber-200">
              <div className="flex items-center mb-4">
                <Eye className="h-6 w-6 text-amber-600 mr-3" />
                <h3 className="text-xl font-bold text-slate-900">The Ancient Vision</h3>
              </div>
              <p className="mb-4">
                Long before the first computer hummed to life, the ancient Egyptians told of 
                the Eye of Horus—a symbol of protection and wholeness that was shattered in 
                cosmic battle. Each fragment represented a fraction of completeness: 1/2, 1/4, 
                1/8, 1/16, 1/32, and 1/64. But when reassembled, these fractions totaled only 
                63/64ths. The missing 1/64th was said to be the magic that made the eye whole—
                the divine spark that transformed mere sight into true vision.
              </p>
              <p className="mb-4">
                This ancient mystery would echo through millennia, waiting for a digital age 
                when data itself would face the same fractured fate. For in our modern world 
                of information, we too had assembled all the pieces—demographics, behaviors, 
                patterns, trends—yet something essential remained missing. The magic that 
                transforms raw data into meaningful insight while preserving the sacred 
                privacy of the individual.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-6 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">The Discovery</h2>
              <p className="mb-4">
                Gwylym Owen first noticed it during a late-night session with a particularly 
                stubborn healthcare dataset. The numbers were there—patient records, treatment 
                outcomes, demographic patterns—but something essential was missing. Not the data 
                itself, but the <em>soul</em> of the data. The human stories that gave meaning 
                to the statistics, yet could never be shared without betraying the sacred trust 
                of privacy.
              </p>
              <p className="mb-4">
                As he stared at his screen, the pulsing cursor seemed to echo the rhythm of 
                the ancient Eye of Horus—that eternal symbol watching over his work. "There 
                must be a way," he whispered to the glowing screens that surrounded him like 
                digital campfires, "to capture the essence without capturing the individual. 
                To preserve the pattern while protecting the person."
              </p>
              <p className="mb-4">
                In that moment, he understood: he was searching for the missing 1/64th—not 
                in ancient mythology, but in modern data science. The divine fraction that 
                would make datasets whole without compromising the wholeness of human privacy.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8">
              <div className="flex items-center mb-4">
                <Database className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-slate-900">The Synthetic Revelation</h3>
              </div>
              <p className="mb-4">
                As dawn approached, the answer came not as a thunderbolt, but as a gentle 
                realization—like watching morning mist transform into dew. The missing fraction 
                wasn't lost; it was waiting to be <em>created</em>. Synthetic data: artificial 
                yet authentic, fabricated yet faithful to the underlying truths.
              </p>
              <p className="mb-4">
                This was digital alchemy of the highest order—transmuting raw data into golden 
                insights while leaving no trace of the original source. The patterns would live 
                on, but the people would remain forever protected. Like the Eye of Horus made 
                whole again, data could be complete without compromising its sacred trust.
              </p>
              <p>
                The missing 1/64th had been found at last—not as a fraction to be calculated, 
                but as magic to be conjured. The divine spark that transforms mere information 
                into true understanding, mere data into genuine wisdom.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-4">The Eight Realms</h2>
            <p className="mb-6">
              From this revelation, eight distinct realms of synthetic data began to emerge, 
              each with its own magical properties and protective enchantments, each carrying 
              a fragment of the restored Eye's vision:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-bold text-red-800 mb-2">CHANGES</h4>
                <p className="text-sm text-red-700">
                  Where synthetic patients tell their stories without revealing their names, 
                  and epidemiological patterns dance in perfect privacy—the healing vision 
                  of the Eye restored.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">POISON</h4>
                <p className="text-sm text-blue-700">
                  Where community sentiment flows like digital rivers, guiding law enforcement 
                  toward harmony without exposing individual voices—the protective gaze 
                  watching over society.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 mb-2">STRIVE</h4>
                <p className="text-sm text-green-700">
                  Where strategic simulations unfold like chess games played by artificial minds, 
                  revealing tactical truths without compromising operational secrets—the 
                  far-seeing wisdom of ancient seers.
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-bold text-orange-800 mb-2">HYDRA</h4>
                <p className="text-sm text-orange-700">
                  Where synthetic flames teach real firefighters, and digital disasters 
                  prevent actual tragedies through the magic of predictive modeling—the 
                  Eye's power to foresee and prevent.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-bold text-purple-800 mb-2">SIREN</h4>
                <p className="text-sm text-purple-700">
                  Where artificial emergencies train real heroes, and synthetic patients 
                  help save actual lives through optimized response patterns—the 
                  life-giving vision that heals.
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 className="font-bold text-indigo-800 mb-2">REFORM</h4>
                <p className="text-sm text-indigo-700">
                  Where digital rehabilitation models guide real transformation, and synthetic 
                  behavioral patterns illuminate paths to genuine redemption—the Eye's 
                  power to see potential for change.
                </p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <h4 className="font-bold text-teal-800 mb-2">INSURE</h4>
                <p className="text-sm text-teal-700">
                  Where risks from all realms converge in synthetic harmony, creating 
                  insurance models that protect without exposing the protected—the 
                  all-seeing Eye that guards against future perils.
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-2">SHIELD</h4>
                <p className="text-sm text-slate-700">
                  Where cyber threats exist only in synthetic form, allowing defenders 
                  to train against dangers that never truly materialized—the Eye's 
                  vigilant watch over the digital realm.
                </p>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-6 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">The Guardian's Oath</h2>
              <p className="mb-4">
                As the sun rose on that transformative morning, Gwylym understood his calling. 
                He would become a guardian of the missing fraction—not to find what was lost, 
                but to create what was needed. Like the ancient priests who tended the Eye 
                of Horus, he would watch over data with protective power, ensuring its 
                wholeness while preserving its sanctity.
              </p>
              <p className="mb-4">
                Auspexi would be more than a company; it would be a covenant between technology 
                and ethics, between innovation and privacy. The logo—an abstracted Eye of Horus 
                pulsing with digital life—would serve as a constant reminder of this sacred duty. 
                Each gentle pulse representing the heartbeat of synthetic data, alive with 
                possibility yet bound by protective enchantments.
              </p>
              <p className="mb-4">
                The synthetic datasets would carry the essence of truth without the burden of 
                identity. They would be real enough to teach, accurate enough to predict, and 
                artificial enough to protect. In this digital alchemy, the missing fraction 
                would finally be found—not in what was taken, but in what was given freely.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl mb-8">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-bold text-slate-900">The Eternal Promise</h3>
              </div>
              <p className="mb-4 italic">
                "We are the architects of the unseen," Gwylym declared to the morning light 
                streaming through his window, his gaze falling upon the pulsing logo on his 
                screen—the Eye of Horus reborn for the digital age. "We craft realities that 
                serve without betraying, that illuminate without exposing, that teach without 
                revealing."
              </p>
              <p className="font-semibold text-slate-800">
                And so Auspexi was born—not from the desire to collect data, but from the 
                wisdom to create it. The missing fraction had been found at last, not in 
                the shadows of what was hidden, but in the light of what could be synthesized. 
                The Eye of Horus was whole again, watching over the digital realm with 
                protective power and divine insight.
              </p>
            </div>

            <div className="text-center">
              <p className="text-lg text-slate-600 mb-6">
                Today, the magic continues. Every synthetic dataset we create carries forward 
                this original promise: to serve humanity's need for knowledge while honoring 
                the individual's right to privacy. In the realm of artificial data, we have 
                found the most human solution of all. The Eye watches, the data flows, and 
                the missing fraction—that divine spark of synthetic creation—makes all things 
                whole.
              </p>
              
              <div className="bg-white p-6 rounded-xl shadow-md border border-blue-200">
                <p className="text-slate-700 italic">
                  "The missing fraction was never lost—it was waiting to be imagined into existence, 
                  like the Eye of Horus restored by divine magic, making vision complete once more."
                </p>
                <footer className="mt-2 text-slate-600 text-sm">
                  — The Auspexi Chronicles
                </footer>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Join the Synthetic Data Revolution
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Discover how our magical approach to data synthesis can transform your industry
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/data-suites"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Explore Our Data Suites
            </Link>
            <Link
              to="/contact"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Begin Your Journey
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissingFraction;