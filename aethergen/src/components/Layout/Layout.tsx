import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  canAccessPlatform?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, canAccessPlatform = false }) => {
  return (
    <div 
      className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100 overflow-x-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      <Header canAccessPlatform={canAccessPlatform} />
      <main className="flex-grow px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
