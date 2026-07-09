import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import Navbar from "../components/Navbar";
import { ArrowLeft, User as UserIcon, Lock, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const updateData: any = { full_name: name };
      
      // Only include password if the user typed one
      if (password) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        updateData.password = password;
      }

      const updatedUser = await api.user.updateMe(updateData);
      setUser(updatedUser);
      setSuccess("Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update profile details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-12 py-10 space-y-8">
        <div>
          <Link to="/" className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-2 transition-colors duration-200">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        <div className="bg-gradient-to-r from-card-dark to-card-dark/40 border border-border-dark rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl">
              <UserIcon className="w-12 h-12 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white m-0 tracking-tight">User Profile Settings</h1>
              <p className="text-xs text-gray-400 mt-1">Manage your account preferences and login credentials</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Summary Sidebar */}
          <div className="lg:col-span-1 bg-card-dark border border-border-dark rounded-3xl p-6 space-y-6 h-fit">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Account Summary</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-500 block mb-0.5">Full Name</span>
                  <span className="text-xs font-semibold text-white">{user?.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block mb-0.5">Email Address</span>
                  <span className="text-xs font-semibold text-white">{user?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block mb-0.5">Role</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {user?.is_superuser ? "Administrator" : "Standard User"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 bg-card-dark border border-border-dark rounded-3xl p-6 md:p-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Modify Profile</h3>

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs mb-6">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-bg-dark border border-border-dark focus:border-emerald-500/50 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Email (Read Only)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full bg-bg-dark/40 border border-border-dark rounded-2xl pl-12 pr-4 py-3 text-xs text-gray-500 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="h-[1px] bg-border-dark" />

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Change Password (Optional)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        minLength={8}
                        className="w-full bg-bg-dark border border-border-dark focus:border-emerald-500/50 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full bg-bg-dark border border-border-dark focus:border-emerald-500/50 rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all duration-300"
                      />
                    </div>
                  </div>
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
                    Updating Profile...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
