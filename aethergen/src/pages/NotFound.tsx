import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h2 className="text-4xl font-extrabold mb-4">Page Not Found</h2>
      <p className="text-slate-300 mb-8">We couldn't find that view. Returning you to Home.</p>
      <a href="#/home" className="inline-block px-4 py-2 bg-blue-600 rounded-md">Go Home</a>
    </div>
  );
};

export default NotFound;


