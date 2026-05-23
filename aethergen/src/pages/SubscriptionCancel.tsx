import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, Mail, MessageSquare } from 'lucide-react';

const SubscriptionCancel = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cancel Hero */}
      <section className="bg-gradient-to-br from-orange-50 to-red-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <XCircle className="h-20 w-20 text-orange-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Subscription Cancelled
            </h1>
            <p className="text-xl text-slate-600">
              Your subscription process was cancelled. No charges have been made to your account.
            </p>
          </div>
        </div>
      </section>

      {/* What Happened */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              What Happened?
            </h2>
            <p className="text-xl text-slate-600">
              You cancelled the subscription process before completing payment. 
              Your account remains unchanged and no charges were processed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Still Interested?</h3>
              <p className="text-slate-600 mb-6">
                You can return to our subscription page anytime to complete your purchase. 
                Your 14-day free trial is still available.
              </p>
              <Link
                to="/subscriptions"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Subscriptions
              </Link>
            </div>

            <div className="bg-slate-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Have Questions?</h3>
              <p className="text-slate-600 mb-6">
                If you encountered any issues during checkout or have questions about our plans, 
                we're here to help.
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:sales@auspexi.com"
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </a>
                <Link
                  to="/contact"
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Form
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Options */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Explore Other Options
            </h2>
            <p className="text-xl text-slate-600">
              Learn more about Auspexi and our synthetic data solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Data Suites</h3>
              <p className="text-slate-600 mb-4">
                Explore our comprehensive synthetic data offerings across eight industries.
              </p>
              <Link
                to="/data-suites"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Learn More →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Blog</h3>
              <p className="text-slate-600 mb-4">
                Read our latest insights on synthetic data, AI innovation, and industry trends.
              </p>
              <Link
                to="/blog"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Read Articles →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Technology</h3>
              <p className="text-slate-600 mb-4">
                Discover the advanced AI and privacy-preserving technologies behind our platform.
              </p>
              <Link
                to="/technology"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Explore Tech →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionCancel;