import React, { useState } from "react";
import { UserProfile } from "../types";
import { Lock, User, ShieldCheck, Cpu, Key, LogIn, Eye, EyeOff, Info, Coins, ShieldAlert } from "lucide-react";

interface AuthScreenProps {
  allProfiles: UserProfile[];
  onLogin: (profileId: string) => void;
  onCreateProfileWithPassword: (username: string, initialFund: number, passwordStr: string) => void;
}

export default function AuthScreen({
  allProfiles,
  onLogin,
  onCreateProfileWithPassword,
}: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const username = usernameInput.trim();
    const password = passwordInput.trim();

    if (!username) {
      setErrorMsg("Username is required.");
      return;
    }
    if (password.length < 4) {
      setErrorMsg("Password must be at least 4 characters long.");
      return;
    }

    if (isAdminMode) {
      if (username.toLowerCase() === "master@admin.com" && password === "Mama4you@") {
        onLogin("admin-uid");
      } else {
        setErrorMsg("Access Denied: Invalid Administrative Credentials.");
      }
      return;
    }

    // Direct match bypass if typed in normal login screen
    if (username.toLowerCase() === "master@admin.com") {
      if (password === "Mama4you@") {
        onLogin("admin-uid");
      } else {
        setErrorMsg("Access Denied: Incorrect administrative security token.");
      }
      return;
    }

    if (isRegister) {
      // Check if username already exists
      const exists = allProfiles.some(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      );
      if (exists) {
        setErrorMsg("Username is already taken by a registered profile.");
        return;
      }

      onCreateProfileWithPassword(username, 0, password);
    } else {
      // Sign In Flow
      const matchedProfile = allProfiles.find(
        (p) => p.username.toLowerCase() === username.toLowerCase()
      );

      if (!matchedProfile) {
        setErrorMsg("Invalid username or profile not registered.");
        return;
      }

      // Check password (defaults have password123, custom have their registered password)
      const expectedPassword = matchedProfile.password || "password123";
      if (password !== expectedPassword) {
        setErrorMsg("Access Denied: Incorrect password hash credentials.");
        return;
      }

      onLogin(matchedProfile.id);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans"
      id="auth-screen-container"
    >
      {/* Decorative abstract elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#e82127]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff3b42]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-md w-full bg-[#141414] border border-white/5 rounded-2xl shadow-2xl p-8 space-y-6 relative z-10">
        {/* Terminal Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg transition-all duration-300 ${
            isAdminMode 
              ? "bg-amber-500/10 text-amber-500 border-amber-500/30" 
              : "bg-[#e82127]/10 text-[#e82127] border-[#e82127]/30"
          }`}>
            {isAdminMode ? <ShieldAlert className="w-7 h-7" /> : <Cpu className="w-7 h-7" />}
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-black tracking-widest text-white uppercase">
              TESLA <span className={isAdminMode ? "text-amber-500" : "text-[#e82127]"}>
                {isAdminMode ? "CONTROL" : "TRADE"}
              </span>
            </h1>
            <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">
              {isAdminMode ? "ADMINISTRATIVE ACCESS GATEWAY" : "PORTFOLIO SECURE ACCESS GATEWAY"}
            </p>
          </div>
        </div>

        {/* Tab switchers - separate pages/states */}
        <div className="flex border-b border-white/5 pb-2">
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(false);
              setErrorMsg(null);
            }}
            className={`flex-1 pb-2 text-[10px] font-mono uppercase tracking-widest transition duration-150 ${
              !isAdminMode
                ? "text-[#e82127] border-b-2 border-[#e82127] font-black"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Investor Terminal
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(true);
              setIsRegister(false);
              setErrorMsg(null);
            }}
            className={`flex-1 pb-2 text-[10px] font-mono uppercase tracking-widest transition duration-150 ${
              isAdminMode
                ? "text-amber-500 border-b-2 border-amber-500 font-black"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            🔒 Admin Portal
          </button>
        </div>

        {/* Security Warning Panel */}
        <div className="bg-black/40 border border-white/5 rounded-lg p-3 flex items-start gap-2.5">
          <Lock className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isAdminMode ? "text-amber-500" : "text-[#e82127]"}`} />
          <div className="text-[10px] font-mono text-gray-400 space-y-0.5 leading-relaxed">
            <span className="text-zinc-200 font-bold block uppercase">
              {isAdminMode ? "SECURE ENCRYPTED MAIN CONTROL" : "CRYPTOGRAPHIC AUDIT SECURED"}
            </span>
            {isAdminMode 
              ? "Access is restricted to authorized credentials only. All operations logged under RLS strict security schema."
              : "Terminal sessions are stored locally in secure sandbox storage. Always lock your terminal before departing."}
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className={`p-3 border rounded-lg text-xxs font-mono flex items-start gap-2 ${
            isAdminMode 
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
              : "bg-[#e82127]/10 border-[#e82127]/20 text-red-100"
          }`}>
            <span className={`text-white text-[9px] px-1 py-0.5 font-bold rounded uppercase shrink-0 ${
              isAdminMode ? "bg-amber-500" : "bg-[#e82127]"
            }`}>
              Denied
            </span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-gray-400 tracking-wider block uppercase">
              {isAdminMode ? "ADMIN USERNAME / EMAIL" : "INVESTOR USERNAME"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder={isAdminMode ? "master@admin.com" : "e.g. ChiefCyberBroker"}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className={`w-full bg-black border border-white/10 pl-9 pr-3 py-2 rounded text-xs font-mono text-zinc-100 outline-none transition duration-150 ${
                  isAdminMode ? "focus:border-amber-500" : "focus:border-[#e82127]"
                }`}
                id="auth-username-field"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xxs font-mono text-gray-400 tracking-wider block uppercase">
              {isAdminMode ? "ADMIN ACCESS KEY" : "NETWORK ACCESS PASSWORD"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={`w-full bg-black border border-white/10 pl-9 pr-10 py-2 rounded text-xs font-mono text-zinc-100 outline-none transition duration-150 ${
                  isAdminMode ? "focus:border-amber-500" : "focus:border-[#e82127]"
                }`}
                id="auth-password-field"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-500 hover:text-white transition cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 text-white font-mono text-xs rounded-lg uppercase tracking-widest transition duration-150 font-bold flex items-center justify-center gap-2 cursor-pointer ${
              isAdminMode 
                ? "bg-amber-600 hover:bg-amber-500 hover:shadow-amber-500/10" 
                : "bg-[#e82127] hover:bg-[#d11b21] hover:shadow-lg hover:shadow-red-500/5"
            }`}
            id="auth-submit-button"
          >
            <ShieldCheck className="w-4 h-4" />
            {isAdminMode 
              ? "Access Central Command" 
              : isRegister ? "Register & Enter Terminal" : "Authenticate Access Token"}
          </button>
        </form>

        {/* Switch mode option (only relevant if not admin) */}
        {!isAdminMode && (
          <div className="border-t border-white/5 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-xxs font-mono text-gray-400 hover:text-white uppercase tracking-wider transition cursor-pointer"
              id="auth-toggle-mode-btn"
            >
              {isRegister
                ? "Already Registered? Sign In to established account"
                : "Register fresh securing profile"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
