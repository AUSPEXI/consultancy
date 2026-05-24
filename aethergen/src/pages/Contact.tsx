import React from 'react';
import { Mail, Phone, MapPin, Clock, Globe, Award, Rocket, Brain, Eye, Sparkles, CheckCircle, Users, Building, Zap } from 'lucide-react';

const Contact = () => {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      details: ['sales@auspexi.com'],
      description: 'Direct communication with our team'
    },
    {
      icon: MapPin,
      title: 'Location',
      details: ['Surrey, United Kingdom'],
      description: 'Headquartered in the heart of London'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: ['Monday - Friday', '9:00 AM - 6:00 PM GMT'],
      description: 'UK business hours with global reach'
    }
  ];

  const companyHighlights = [
    {
      title: 'High‑Scale Generation',
      description: 'Billion‑row synthetic dataset demonstration with validated metrics',
      icon: Award,
      color: 'text-orange-600'
    },
    {
      title: 'Proprietary Technology',
      description: 'Advanced pattern recognition and cosmic modeling systems',
      icon: Rocket,
      color: 'text-blue-600'
    },
    {
      title: 'Global Leadership',
      description: 'Leading the synthetic data revolution with unmatched scale and innovation',
      icon: Globe,
      color: 'text-green-600'
    },
    {
      title: 'Innovation Pipeline',
      description: 'Ongoing R&D into methods and tooling for future markets',
      icon: Brain,
      color: 'text-purple-600'
    }
  ];

  const contactForm = {
    title: 'Get in Touch',
    description: 'Ready to transform your data strategy with world record technology?',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'company', label: 'Company', type: 'text', required: false },
      { name: 'industry', label: 'Industry', type: 'select', required: false, options: ['Healthcare', 'Automotive', 'Finance', 'Government', 'Other'] },
      { name: 'message', label: 'Message', type: 'textarea', required: true }
    ]
  };

  const pressInquiries = [
    {
      title: 'Proven Result',
      description: 'Press materials and documentation for our billion‑row synthetic data demonstration',
      icon: Award,
      link: '/press'
    },
    {
      title: 'Founder Story',
      description: 'The Phoenix Rising story - from 10-hour gardening days to revolutionary technology',
      icon: Users,
      link: '/about'
    },
    {
      title: 'Technology Innovation',
      description: 'Details on our proprietary technology and breakthrough innovations',
      icon: Rocket,
      link: '/technology'
    },
    {
      title: 'Investment Opportunities',
      description: 'Information for investors interested in our revolutionary technology',
      icon: Building,
      link: '/contact'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Ready to transform your data strategy with world record technology? Let's discuss how we can help.
          </p>
        </div>
      </section>

      {/* Company Highlights */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyHighlights.map((highlight, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-all duration-300 shadow-md"
              >
                <highlight.icon className={`w-12 h-12 mx-auto mb-4 ${highlight.color}`} />
                <h3 className="text-lg font-bold text-slate-900 mb-3">{highlight.title}</h3>
                <p className="text-slate-600 text-sm">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-md">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{contactForm.title}</h2>
              <p className="text-slate-600 mb-6">{contactForm.description}</p>
              
              <form className="space-y-6">
                {contactForm.fields.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        name={field.name}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                        required={field.required}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        name={field.name}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-500"
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option, optionIndex) => (
                          <option key={optionIndex} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Details */}
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-md"
                >
                  <div className="flex items-start">
                    <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 mr-4">
                      <info.icon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{info.title}</h3>
                      <p className="text-slate-600 mb-3">{info.description}</p>
                      {info.details.map((detail, detailIndex) => (
                        <p key={detailIndex} className="text-blue-600 font-medium">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Press Inquiries */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Press & Media</h2>
            <p className="text-xl text-slate-600">Resources for journalists and media inquiries</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pressInquiries.map((inquiry, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center hover:border-blue-300 transition-all duration-300 shadow-md"
              >
                <inquiry.icon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-3">{inquiry.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{inquiry.description}</p>
                <a
                  href={inquiry.link}
                  className="text-blue-500 hover:text-blue-600 font-semibold text-sm"
                >
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;