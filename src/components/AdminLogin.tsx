/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Lock, 
  User, 
  Waves, 
  QrCode, 
  AlertCircle,
  Eye,
  EyeOff,
  Languages
} from "lucide-react";
import { TRANSLATIONS } from "../translations";
import { motion } from "motion/react";

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onLifeguardScan: () => void;
  lang?: "en" | "zh";
  onLangToggle?: (lang: "en" | "zh") => void;
}

export default function AdminLogin({ onLoginSuccess, onLifeguardScan, lang = "en", onLangToggle }: AdminLoginProps) {
  const [localLang, setLocalLang] = useState<"en" | "zh">(lang);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Synchronized language toggle
  const handleLangToggle = () => {
    const next = localLang === "en" ? "zh" : "en";
    setLocalLang(next);
    if (onLangToggle) {
      onLangToggle(next);
    }
  };

  const t = TRANSLATIONS[localLang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === "Seahorse" && password === "Seahorse691121") {
      setErrorMsg(null);
      localStorage.setItem("swimpool_admin_logged_in", "true");
      onLoginSuccess();
    } else {
      setErrorMsg(t.accountErr);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 relative">
      {/* Wave top border */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-600"></div>

      {/* Language Switch Top Corner */}
      <div className="absolute top-5 right-5 z-10">
        <button
          onClick={handleLangToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-sm rounded-xl text-xs transition active:scale-95 cursor-pointer"
        >
          <Languages className="h-4 w-4 text-blue-600 animate-pulse" />
          <span>{localLang === "en" ? "English" : "简体中文"}</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce">
            <Waves className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{t.loginTitle}</h2>
          <p className="text-xs text-slate-500 font-semibold">{t.loginSubTitle}</p>
        </div>

        {/* Credentials hints */}
        <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-xl text-[11px] text-blue-800 leading-relaxed text-center font-semibold">
          💡 {t.loginHint} <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200/50">Seahorse</span> 
          ，{t.loginPasswordHint} <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200/50">Seahorse691121</span>
        </div>

        {/* Administration Log In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-650 block">{t.adminAccount}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="h-4 w-4" />
              </span>
              <input 
                type="text" 
                placeholder={t.enterUsername} 
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                required
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-250 focus:border-blue-500 rounded-xl py-2 px-3 pl-10 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-650 block">{t.loginPassword}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder={t.enterPassword} 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                required
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-250 focus:border-blue-500 rounded-xl py-2 px-3 pl-10 pr-10 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error alerts */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-150 text-rose-600 text-xs font-bold leading-relaxed animate-pulse">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition duration-200 shadow-md hover:shadow-lg cursor-pointer text-sm font-bold active:scale-[0.99]"
          >
            {t.unlockSystem}
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-205"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider">{t.noLoginChannelHeading}</span>
          <div className="flex-grow border-t border-slate-205"></div>
        </div>

        {/* Lifeguard Scan Channel link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onLifeguardScan}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-850 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer transition-all active:scale-[0.99]"
          >
            <QrCode className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
            <span>{t.lifeguardNoLoginBtn}</span>
          </button>
          <p className="text-[10px] text-slate-450 mt-2.5 leading-relaxed font-semibold">
            {t.lifeguardNoLoginHint}
          </p>
        </div>

      </motion.div>

      {/* Footer credits info */}
      <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-8 select-none">
        {localLang === "en" 
          ? "SEAHORSE FITNESS MEMBER PORTAL • CLOUDFLARE COMPATIBLE" 
          : "海马游泳馆 VIP 凭证卡系统 • 兼容 D1/Workers 服务器架构"}
      </span>
    </div>
  );
}
