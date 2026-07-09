import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { TrendingUp, LogOut, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-opacity-70 bg-bg-dark border-b border-border-dark py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition-all duration-300">
          <TrendingUp className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div>
          <span className="font-sans font-bold text-xl tracking-tight text-white">
            Tech<span className="text-emerald-400">Trade</span>
          </span>
          <span className="block text-[9px] text-gray-500 tracking-widest uppercase">
            AI Quant Platform
          </span>
        </div>
      </Link>

      {isAuthenticated && (
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
            <div className="bg-emerald-500/20 w-2 h-2 rounded-full animate-pulse" />
            <span>Market Active</span>
          </div>

          <div className="h-4 w-[1px] bg-border-dark hidden md:block" />

          <Link
            to="/scanner"
            className="text-xs text-gray-300 hover:text-emerald-400 font-bold uppercase transition-colors duration-200"
          >
            Scanner
          </Link>

          <div className="h-4 w-[1px] bg-border-dark" />

          <Link
            to="/journal"
            className="text-xs text-gray-300 hover:text-emerald-400 font-bold uppercase transition-colors duration-200"
          >
            Journal
          </Link>

          <div className="h-4 w-[1px] bg-border-dark" />

          <Link
            to="/sentiment"
            className="text-xs text-gray-300 hover:text-emerald-400 font-bold uppercase transition-colors duration-200"
          >
            Sentiment
          </Link>

          <div className="h-4 w-[1px] bg-border-dark" />

          <Link
            to="/backtest"
            className="text-xs text-gray-300 hover:text-emerald-400 font-bold uppercase transition-colors duration-200"
          >
            Backtest
          </Link>

          <div className="h-4 w-[1px] bg-border-dark" />

          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="bg-card-dark border border-border-dark hover:border-emerald-500/30 rounded-full px-3 py-1.5 flex items-center gap-2 transition-all duration-300 hover:scale-102"
              title="View Profile Settings"
            >
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-gray-300 font-medium">{user?.full_name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 p-2 rounded-xl transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
