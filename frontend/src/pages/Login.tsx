import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { TrendingUp, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      // 1. Get access token
      const authResponse = await api.auth.login(email, password);
      // Save token temporarily so getMe can fetch profile
      localStorage.setItem("token", authResponse.access_token);

      // 2. Fetch user profile
      const userProfile = await api.user.getMe();

      // 3. Save to Zustand store
      loginStore(authResponse.access_token, userProfile);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-card-dark border border-border-dark rounded-3xl p-8 shadow-2xl shadow-black/40 relative overflow-hidden transition-all duration-300">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-gray-500 mt-1">Log in to manage your AI stock analysis platform</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs mb-6 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-bg-dark border border-border-dark focus:border-emerald-500/50 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-gray-600 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-dark border border-border-dark focus:border-emerald-500/50 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-gray-600 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-semibold py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/20 text-xs flex justify-center items-center gap-2 cursor-pointer mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-200">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
