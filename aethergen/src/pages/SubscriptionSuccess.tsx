import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Key, Mail, ArrowRight } from 'lucide-react';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      // In a real implementation, you would fetch session details from your backend
      // For now, we'll simulate the data
      setTimeout(() => {
        setSessionData({
          customer_email: 'user@example.com',
          plan_type: 'premium',
          amount_total: 50000, // £500.00 in pence
          currency: 'gbp'
        });
        setLoading(false);
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  if (!sessionId || !sessionData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Invalid Session</h1>
          <p className="text-slate-600 mb-6">We couldn't find your subscription details.</p>
          <Link to="/subscriptions" className="text-blue-600 hover:text-blue-700">
            Return to Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const nextSteps = [
    {
      icon: Mail,
      title: 'Check Your Email',
      description: 'We\'ve sent a confirmation email with your subscription details and receipt.',
    },
    {
      icon: Key,
      title: 'Access Your API Keys',
      description: 'Your API keys and documentation are now available in your account dashboard.',
    },
    {
      icon: Download,
      title: 'Download Data Suites',
      description: 'Start accessing synthetic datasets immediately through our platform.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Success Hero */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Welcome to Auspexi!
            </h1>
            <p className="text-xl text-slate-600">
              Your subscription has been successfully activated. You now have access to our 
              synthetic data suites and can begin transforming your data strategy.
            </p>
          </div>

          {/* Subscription Details */}
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Subscription Details</h2>
            <div className="space-y-3 text-left">
              <div className="flex justify-between">
                <span className="text-slate-600">Plan:</span>
                <span className="font-semibold text-slate-900 capitalize">{sessionData.plan_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Amount:</span>
                <span className="font-semibold text-slate-900">
                  {formatAmount(sessionData.amount_total, sessionData.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Billing:</span>
                <span className="font-semibold text-slate-900">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              What's Next?
            </h2>
            <p className="text-xl text-slate-600">
              Here's how to get started with your new Auspexi subscription
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {nextSteps.map((step, index) => (
              <div key={index} className="text-center p-6 bg-slate-50 rounded-xl">
                <step.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/data-suites"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
              >
                Explore Data Suites
              </a>
              <a
                href="/contact"
                className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-center"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Need Help Getting Started?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Our team is here to help you make the most of your Auspexi subscription
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:sales@auspexi.com"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-flex items-center justify-center"
            >
              Email Support
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
            <a
              href="/blog"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              Read Documentation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionSuccess;