import React, { useEffect, useState } from 'react';
import { assertSupabase } from '../../services/supabaseClient';
import PlatformAccess from '../Billing/PlatformAccess';
import AethergenDashboard from '../Dashboard/AethergenDashboard';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const sb = assertSupabase();

        // 1) Handle magic link callbacks: hash (access_token) or PKCE code
        const hash = window.location.hash || '';
        const params = new URLSearchParams(window.location.search);

        // Handle auth errors from Supabase (e.g., otp_expired)
        if (hash.includes('error=')) {
          const errParams = new URLSearchParams(hash.replace(/^#/, ''));
          const errorCode = errParams.get('error_code');
          const errorDesc = errParams.get('error_description');
          if (errorCode === 'otp_expired') {
            setStatus('Your login link has expired or was already used. Please request a new link.');
          } else {
            setStatus(errorDesc || 'Authentication error. Please request a new link.');
          }
          // Clean the URL hash
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }

        if (hash.includes('access_token')) {
          const { data, error } = await sb.auth.getSession();
          if (!error && data.session?.user?.email) {
            setUserEmail(data.session.user.email);
            // clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (params.get('code')) {
          const { data, error } = await sb.auth.exchangeCodeForSession(params.get('code') as string);
          if (!error && data.session?.user?.email) {
            setUserEmail(data.session.user.email);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // 2) Load any existing session
          const { data: { user } } = await sb.auth.getUser();
          setUserEmail(user?.email || null);
        }

        // 3) Subscribe to auth changes to update UI
        const { data: listener } = sb.auth.onAuthStateChange(async (_event, session) => {
          setUserEmail(session?.user?.email || null);
        });

        return () => {
          listener.subscription.unsubscribe();
        };
      } catch {}
    })();
  }, []);

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🔍 Attempting to send magic link to:', email);
      const sb = assertSupabase();
      console.log('🔍 Supabase client:', !!sb);
      
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/account` }
      });
      
      if (error) {
        console.error('🔍 Supabase auth error:', error);
        throw error;
      }
      
      console.log('🔍 Magic link sent successfully');
      setStatus('Check your email for the login link.');
    } catch (err: any) {
      console.error('🔍 Full error details:', err);
      setStatus(err?.message || 'Failed to send link');
    }
  };

  const logout = async () => {
    try {
      const sb = assertSupabase();
      await sb.auth.signOut();
      setUserEmail(null);
      // Ensure we return to the auth screen
      window.location.replace('/account');
    } catch {}
  };

  return (
    <div>
      {userEmail ? (
        <>
          <AethergenDashboard userEmail={userEmail} onLogout={logout} />
          {/* Fallback minimal UI if dashboard fails to render for any reason */}
          <div className="sr-only">Signed in as {userEmail}</div>
        </>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Aethergen</h2>
              <p className="text-gray-600">Sign in to access your synthetic data platform</p>
            </div>
            
            <form onSubmit={sendMagicLink} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-2">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Send Magic Link
              </button>
              
              {status && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">{status}</p>
                </div>
              )}
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                We'll send you a secure login link to your email
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;


