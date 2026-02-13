import { loginAdmin } from '@/services/api';
import React, { useState } from 'react';

const AuthScreen = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginAdmin(credentials);

      const token = res.data.token;
      localStorage.setItem("adminToken", token);

      onLogin(token); // pass token to App.jsx
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] transition-all duration-700">
      <div className="w-full max-w-md mx-4 glass p-10 rounded-3xl shadow-2xl text-center fade-in border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30 anim-pop">
            <i className="ri-command-fill text-4xl text-white"></i>
          </div>
          <h2 className="text-3xl font-extrabold mb-2 gradient-text">Admin OS</h2>
          <p className="text-slate-500 text-sm mb-8 font-medium">Secure Neural Interface</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-900/50 border border-white/5 text-white focus:border-indigo-500 focus:bg-slate-900 outline-none transition duration-300"
                placeholder="Email"
                required
              />
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full p-4 rounded-xl bg-slate-900/50 border border-white/5 text-white focus:border-indigo-500 focus:bg-slate-900 outline-none transition duration-300"
                placeholder="Password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white p-4 rounded-xl font-bold tracking-wide transition shadow-lg shadow-indigo-500/25 anim-pop disabled:opacity-50"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i> AUTHENTICATING...
                </>
              ) : (
                'INITIALIZE SESSION'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;