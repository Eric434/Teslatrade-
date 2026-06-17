import React from "react";
import { UserProfile } from "../types";
import { User, ShieldCheck } from "lucide-react";

interface UserSwitcherProps {
  currentProfile: UserProfile;
  allProfiles: UserProfile[];
  onSelectProfile: (profile: UserProfile) => void;
  onCreateProfile: (username: string, initialFund: number) => void;
}

export default function UserSwitcher({
  currentProfile,
}: UserSwitcherProps) {
  return (
    <div className="bg-[#0d0f19] border border-[#1e2338] p-5 rounded-xl shadow-2xl space-y-4" id="user-profile-panel">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#e82127]/10 rounded-lg text-[#e82127]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-sans font-bold text-zinc-100 tracking-tight uppercase">Terminal Account</h2>
            <p className="text-xxs font-mono text-gray-500 uppercase tracking-widest">SECURE CREDENTIAL IDENTITY</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-widest animate-pulse">
          Active
        </div>
      </div>

      {/* Active User Security Card (Read-only status) */}
      <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/5 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentProfile?.avatar || ""}
              referrerPolicy="no-referrer"
              alt={currentProfile?.username || "Guest"}
              className="w-10 h-10 rounded-full border border-[#e82127]/40 object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-[#0d0f19] rounded-full"></span>
          </div>
          <div>
            <div className="text-xs font-mono text-white font-black tracking-wider flex items-center gap-1">
              {currentProfile?.username || "Guest"}
              <ShieldCheck className="w-3.5 h-3.5 text-[#e82127]" />
            </div>
            <div className="text-xxs font-mono text-gray-500 mt-0.5">UID: {currentProfile?.id ? currentProfile.id.substring(0, 12).toUpperCase() : "OFFLINE"}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xxs font-mono text-gray-500 uppercase tracking-widest">Available Cash</div>
          <div className="text-xs font-mono font-bold text-zinc-200">
            ${(currentProfile?.buyingPower || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}
