import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { TrendingUp, User as UserIcon, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginStore = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    setError("");

    try {
      // 1. Create account
      await api.auth.register({
        email,
        password,
        full_name: name,
      });

      // 2. Automate Login
      const authResponse = await api.auth.login(email, password);
      localStorage.setItem("token", authResponse.access_token);

      // 3. Fetch user profile
      const userProfile = await api.user.getMe();

      // 4. Save to Zustand store
      loginStore(authResponse.access_token, userProfile);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-xs text-gray-500 mt-1">Get started with your educational quantitative stock tracker</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-bg-dark border border-border-dark focus:border-emerald-500/50 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-gray-600 outline-none transition-all duration-300"
              />
            </div>
          </div>

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
                placeholder="Min. 8 characters"
                minLength={8}
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
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-200">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
