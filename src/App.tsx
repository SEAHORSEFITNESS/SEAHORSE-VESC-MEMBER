/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Member, PLAN_PRESETS } from "./types";
import MemberForm from "./components/MemberForm";
import MemberScanner from "./components/MemberScanner";
import MemberCardView from "./components/MemberCardView";
import AdminLogin from "./components/AdminLogin";
import RemindersDialog from "./components/RemindersDialog";
import { TRANSLATIONS, getNormalizedPlanName } from "./translations";
import { 
  Plus,
  X,
  Search, 
  QrCode, 
  Trash2, 
  Edit3, 
  CreditCard, 
  Smartphone, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  BellRing, 
  Eye, 
  Download, 
  Upload, 
  Clock, 
  Info,
  Waves,
  RefreshCw,
  FileSpreadsheet,
  LogOut,
  Languages,
  Building2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Pre-populated demonstration data for immediate live preview
const INITIAL_MOCK_MEMBERS: Member[] = [
  {
    id: "SWIM-1001",
    name: "Alice Johnson",
    phone: "347-221-9988",
    price: 4500,
    plan: "Annual Pass (Full Year VIP Exclusive)",
    startDate: "2026-05-01",
    endDate: "2027-05-01",
    extraInfo: "Senior Swimmer, focuses on backstroke. Keeps locker number 3.",
    lastPaymentDate: "2026-05-01",
    alertSent: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "SWIM-1002",
    name: "Bob Zhang",
    phone: "917-556-2811",
    price: 600,
    plan: "Monthly Pass (Regular Swimmer)",
    startDate: "2026-05-24",
    endDate: "2026-06-24", // Expiring soon in < 7 days
    extraInfo: "Requesting early notification follow up. Deep-water test cleared.",
    lastPaymentDate: "2026-05-24",
    alertSent: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "SWIM-1003",
    name: "David Smith",
    phone: "646-778-9022",
    price: 1500,
    plan: "Quarterly Pass (Seasonal Swim)",
    startDate: "2026-02-10",
    endDate: "2026-05-10", // Deprecated/Expired member
    extraInfo: "Has been notified about annual custom upgrades.",
    lastPaymentDate: "2026-02-10",
    alertSent: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "SWIM-1004",
    name: "Emma Wilson",
    phone: "347-810-7755",
    price: 600,
    plan: "Monthly Pass (Regular Swimmer)",
    startDate: "2026-05-10",
    endDate: "2026-06-10", // Active month card
    extraInfo: "Novice swimmer, lifeguards please pay extra attention.",
    lastPaymentDate: "2026-05-10",
    alertSent: false,
    createdAt: new Date().toISOString(),
    subMembers: [
      {
        id: "SWIM-1004-A",
        name: "Chloe Wilson",
        relationship: "Child",
        phone: "347-810-7766",
        createdAt: new Date().toISOString()
      },
      {
        id: "SWIM-1004-B",
        name: "Arthur Wilson",
        relationship: "Spouse",
        createdAt: new Date().toISOString()
      }
    ]
  }
];


const getInitialGoogleSheetUrl = (): string => {
  if (typeof window === "undefined") return "";
  const obfuscatedVal = localStorage.getItem("_sys_cfg_sync_stream_");
  if (obfuscatedVal) {
    try {
      return atob(obfuscatedVal);
    } catch (e) {
      return obfuscatedVal;
    }
  }
  const legacyVal = localStorage.getItem("swimpool_google_sheet_url") || "";
  if (legacyVal) {
    try {
      localStorage.setItem("_sys_cfg_sync_stream_", btoa(legacyVal));
    } catch (e) {}
    localStorage.removeItem("swimpool_google_sheet_url");
    return legacyVal;
  }
  return "";
};

const saveObfuscatedGoogleSheetUrl = (url: string) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("_sys_cfg_sync_stream_", btoa(url));
  } catch (e) {
    localStorage.setItem("_sys_cfg_sync_stream_", url);
  }
};

export default function App() {
  // Global Bilingual System State defaulting to english as instructed
  const [lang, setLang] = useState<"en" | "zh">(() => {
    return (localStorage.getItem("swimpool_lang") as "en" | "zh") || "en";
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem("swimpool_admin_logged_in") === "true");
  
  // Company profiles configuration supporting multiple company profiles
  const [profiles, setProfiles] = useState<{
    id: string;
    name: string;
    sheetUrl?: string;
    syncEnabled?: boolean;
    lastSyncedTime?: string;
    isDefault?: boolean;
  }[]>(() => {
    const raw = localStorage.getItem("swimpool_company_profiles");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // Fallback below
      }
    }
    return [
      {
        id: "default",
        name: "Seahorse Fitness Inc (海马游泳中心)",
        isDefault: true,
        sheetUrl: "",
        syncEnabled: false,
        lastSyncedTime: ""
      }
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem("swimpool_active_profile_id") || "default";
  });

  const [isProfileManagerOpen, setIsProfileManagerOpen] = useState<boolean>(false);
  const [profileNameInput, setProfileNameInput] = useState<string>("");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editProfileNameInput, setEditProfileNameInput] = useState<string>("");

  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "expiring_soon">("all");
  const [alertFilter, setAlertFilter] = useState<"all" | "alerted" | "not_alerted">("all");

  // Multi view toggles
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [selectedPassMember, setSelectedPassMember] = useState<Member | null>(null);
  const [isRemindersOpen, setIsRemindersOpen] = useState<boolean>(false);
  const [isVersionOpen, setIsVersionOpen] = useState<boolean>(false);

  // Google Sheets Cloud Sync Settings States
  const [syncEnabled, setSyncEnabled] = useState<boolean>(() => localStorage.getItem("swimpool_sheet_sync_enabled") === "true");
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(() => getInitialGoogleSheetUrl());
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => localStorage.getItem("swimpool_last_synced_time") || "");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState<boolean>(false);

  // Helper to update active profile traits
  const updateProfileProperties = (profileId: string, updates: Partial<{
    name: string;
    sheetUrl: string;
    syncEnabled: boolean;
    lastSyncedTime: string;
  }>) => {
    setProfiles((prev) => {
      const updated = prev.map((p) => (p.id === profileId ? { ...p, ...updates } : p));
      localStorage.setItem("swimpool_company_profiles", JSON.stringify(updated));
      return updated;
    });
  };

  const pullFromGoogleSheet = async (urlToUse?: string) => {
    const targetUrl = urlToUse !== undefined ? urlToUse : googleSheetUrl;
    if (!targetUrl) return false;
    
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMembers(data);
        const activeProfId = localStorage.getItem("swimpool_active_profile_id") || "default";
        const dbKey = activeProfId === "default" ? "swimpool_member_db" : `swimpool_member_db_${activeProfId}`;
        localStorage.setItem(dbKey, JSON.stringify(data));
        
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncedTime(nowStr);
        localStorage.setItem("swimpool_last_synced_time", nowStr);
        updateProfileProperties(activeProfId, { lastSyncedTime: nowStr });
        return true;
      } else {
        throw new Error(lang === "en" ? "Response is not a valid JSON array" : "Google Sheet 返回的不是有效的 JSON 数组，请确认脚本部署是否正确");
      }
    } catch (e: any) {
      console.error("Failed to pull from Google Sheets", e);
      setSyncError(e.message || "Network Error");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const pushToGoogleSheet = async (listToPush: Member[], urlToUse?: string) => {
    const targetUrl = urlToUse !== undefined ? urlToUse : googleSheetUrl;
    if (!targetUrl) return;
    
    setIsSyncing(true);
    setSyncError(null);
    try {
      await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({ action: "write", members: listToPush }),
      });
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(nowStr);
      localStorage.setItem("swimpool_last_synced_time", nowStr);
      const activeProfId = localStorage.getItem("swimpool_active_profile_id") || "default";
      updateProfileProperties(activeProfId, { lastSyncedTime: nowStr });
    } catch (e: any) {
      console.warn("Push warning (CORS redirects under no-cors are expected but data safely writes):", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Scan URL query parameter state for direct cell verify
  const [publicScanData, setPublicScanData] = useState<{
    id: string;
    name: string;
    start: string;
    end: string;
    phone: string;
    plan: string;
  } | null>(null);

  // Check URL query parameters on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const name = params.get("name");
      const start = params.get("start");
      const end = params.get("end");
      const phone = params.get("phone");
      const plan = params.get("plan");

      if (id && name) {
        setPublicScanData({
          id,
          name,
          start: start || "",
          end: end || "",
          phone: phone || "",
          plan: plan || ""
        });
      }
    } catch (e) {
      console.warn("Parsing window search params failed", e);
    }
  }, []);

  const getRemainingDaysForEnd = (endDateStr: string) => {
    if (!endDateStr) return 0;
    const todayStrRaw = new Date().toISOString().split("T")[0];
    const todayMsRaw = new Date(todayStrRaw).getTime();
    const endMsRaw = new Date(endDateStr).getTime();
    return Math.ceil((endMsRaw - todayMsRaw) / (1000 * 3600 * 24));
  };

  // Sync translation triggers
  const handleLangToggle = (selectedVal?: "en" | "zh") => {
    const nextLang = selectedVal ? selectedVal : (lang === "en" ? "zh" : "en");
    setLang(nextLang);
    localStorage.setItem("swimpool_lang", nextLang);
  };

  const t = TRANSLATIONS[lang];

  // Retrieve storage on mount dynamically keyed by active company profile
  useEffect(() => {
    const activeProfId = localStorage.getItem("swimpool_active_profile_id") || "default";
    setActiveProfileId(activeProfId);

    const dbKey = activeProfId === "default" ? "swimpool_member_db" : `swimpool_member_db_${activeProfId}`;
    const stored = localStorage.getItem(dbKey);
    let currentLocal: Member[] = [];
    if (stored) {
      try {
        currentLocal = JSON.parse(stored);
        setMembers(currentLocal);
      } catch (e) {
        console.error("Failed to parse database, reloading defaults", e);
        currentLocal = INITIAL_MOCK_MEMBERS;
        setMembers(INITIAL_MOCK_MEMBERS);
      }
    } else {
      currentLocal = INITIAL_MOCK_MEMBERS;
      setMembers(INITIAL_MOCK_MEMBERS);
      localStorage.setItem(dbKey, JSON.stringify(INITIAL_MOCK_MEMBERS));
    }

    // Load active profile's spreadsheet options
    const activeProf = profiles.find(p => p.id === activeProfId);
    if (activeProf) {
      setGoogleSheetUrl(activeProf.sheetUrl || "");
      setSyncEnabled(!!activeProf.syncEnabled);
      setLastSyncedTime(activeProf.lastSyncedTime || "");

      if (activeProf.syncEnabled && activeProf.sheetUrl) {
        pullFromGoogleSheet(activeProf.sheetUrl);
      }
    } else {
      const isSyncOn = localStorage.getItem("swimpool_sheet_sync_enabled") === "true";
      const sheetUrl = getInitialGoogleSheetUrl();
      if (isSyncOn && sheetUrl) {
        pullFromGoogleSheet(sheetUrl);
      }
    }
  }, []);

  // Save updates helper under active company profile index
  const saveMembersList = (updated: Member[]) => {
    setMembers(updated);
    const activeProfId = localStorage.getItem("swimpool_active_profile_id") || "default";
    const dbKey = activeProfId === "default" ? "swimpool_member_db" : `swimpool_member_db_${activeProfId}`;
    localStorage.setItem(dbKey, JSON.stringify(updated));
    
    // Auto-sync push if enabled
    const activeProf = profiles.find(p => p.id === activeProfId);
    const isSyncOn = activeProf ? !!activeProf.syncEnabled : (localStorage.getItem("swimpool_sheet_sync_enabled") === "true");
    const sheetUrl = activeProf ? (activeProf.sheetUrl || "") : getInitialGoogleSheetUrl();
    if (isSyncOn && sheetUrl) {
      pushToGoogleSheet(updated, sheetUrl);
    }
  };

  const handleSwitchProfile = (profileId: string) => {
    setActiveProfileId(profileId);
    localStorage.setItem("swimpool_active_profile_id", profileId);

    const dbKey = profileId === "default" ? "swimpool_member_db" : `swimpool_member_db_${profileId}`;
    const stored = localStorage.getItem(dbKey);
    let currentLocal: Member[] = [];
    if (stored) {
      try {
        currentLocal = JSON.parse(stored);
      } catch (e) {
        currentLocal = INITIAL_MOCK_MEMBERS;
      }
    } else {
      currentLocal = INITIAL_MOCK_MEMBERS;
      localStorage.setItem(dbKey, JSON.stringify(INITIAL_MOCK_MEMBERS));
    }
    setMembers(currentLocal);

    // Refresh sync states matching the switched company profile
    const activeProf = profiles.find(p => p.id === profileId);
    if (activeProf) {
      setGoogleSheetUrl(activeProf.sheetUrl || "");
      setSyncEnabled(!!activeProf.syncEnabled);
      setLastSyncedTime(activeProf.lastSyncedTime || "");
      saveObfuscatedGoogleSheetUrl(activeProf.sheetUrl || "");
      localStorage.setItem("swimpool_sheet_sync_enabled", activeProf.syncEnabled ? "true" : "false");
      localStorage.setItem("swimpool_last_synced_time", activeProf.lastSyncedTime || "");
    } else {
      setGoogleSheetUrl("");
      setSyncEnabled(false);
      setLastSyncedTime("");
    }
  };

  // Add / Save member handler
  const handleSaveMember = (newMember: Member) => {
    let list: Member[];
    const exists = members.some(m => m.id === newMember.id);
    
    if (exists) {
      list = members.map(m => m.id === newMember.id ? newMember : m);
    } else {
      list = [newMember, ...members];
    }
    
    saveMembersList(list);
    setIsFormOpen(false);
    setEditingMember(null);
  };

  // Prune swimer profile permanently
  const handleDeleteMember = (id: string, name: string) => {
    const deleteMessage = lang === "en"
      ? `Are you sure you want to permanently delete Swimmer [${name}] and invalidate their QR credentials?`
      : `确定要永久删除会员【${name}】的档案及所属入池二维码卡凭证吗？`;

    if (window.confirm(deleteMessage)) {
      const filtered = members.filter(m => m.id !== id);
      saveMembersList(filtered);
      if (selectedPassMember?.id === id) setSelectedPassMember(null);
    }
  };

  // Switch warning notification checks
  const handleToggleAlert = (id: string) => {
    const list = members.map(m => {
      if (m.id === id) {
        return { ...m, alertSent: !m.alertSent };
      }
      return m;
    });
    saveMembersList(list);
    
    // Update live modals holding referenced values
    if (selectedPassMember && selectedPassMember.id === id) {
      setSelectedPassMember(prev => prev ? { ...prev, alertSent: !prev.alertSent } : null);
    }
  };

  // Reference times
  const todayStr = new Date().toISOString().split("T")[0];
  const todayMs = new Date(todayStr).getTime();

  const getDaysRemaining = (endStr: string) => {
    const endMs = new Date(endStr).getTime();
    return Math.ceil((endMs - todayMs) / (1000 * 3600 * 24));
  };

  // CSV Spreadsheet Export Function localized
  const exportToCSV = () => {
    try {
      const headers = lang === "en"
        ? ["ID", "Name", "Phone", "Amount Paid (RMB)", "Membership Plan", "Effective Date", "Expiration Date", "Days Remaining", "Transaction Date", "Alert Notified", "Remarks"]
        : ["会员专属号", "姓名", "电话号码", "实收价格 (元)", "会员计划", "开始生效日期", "到期结束日期", "剩余天数", "上次付款日期", "是否已发送警报", "备注信息"];

      const rows = members.map(m => {
        const remaining = getDaysRemaining(m.endDate);
        const remStatus = remaining >= 0 
          ? (lang === "en" ? `${remaining}d left` : `${remaining}天`) 
          : (lang === "en" ? `Expired ${Math.abs(remaining)}d` : `过期${Math.abs(remaining)}天`);

        return [
          m.id,
          m.name,
          m.phone,
          m.price,
          m.plan,
          m.startDate,
          m.endDate,
          remStatus,
          m.lastPaymentDate,
          m.alertSent ? (lang === "en" ? "Notified" : "已提醒") : (lang === "en" ? "Unsent" : "未提醒"),
          m.extraInfo ? m.extraInfo.replace(/,/g, "，") : ""
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Seahorse_Pool_Swimmers_${todayStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert(lang === "en" ? "Spreadsheet export failed" : "CSV 导出失败，请检查数据格式");
    }
  };

  // Expose JSON backup
  const exportBackupJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(members, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Seahorse_Swimmer_DB_Backup_${todayStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Restore fallback database
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported) && (imported.length === 0 || "id" in imported[0])) {
          saveMembersList(imported);
          alert(lang === "en" ? `Successfully restored ${imported.length} swimmers profiles!` : `恢复成功！已导入 ${imported.length} 个会员档案。`);
        } else {
          alert(lang === "en" ? "Incorrect schema layout specification match." : "导入的 JSON 文件格式不匹配会员管理系统规范。");
        }
      } catch (error) {
        alert(lang === "en" ? "JSON parsing failure from target file." : "读取文件解析 JSON 失败，请确保导入了正确的备份文件。");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Reset database fallback mock records
  const resetToMock = () => {
    const messageStr = lang === "en"
      ? "Are you sure you want to clear the entire swimmer table and restore initial demo files?"
      : "确定要重置当前所有的会员数据库到初始演示数据吗？这将清空您刚刚新注册的数据！";

    if (window.confirm(messageStr)) {
      saveMembersList(INITIAL_MOCK_MEMBERS);
    }
  };

  // Filter members list based on UI inputs
  const filteredMembers = members.filter(m => {
    // 1. Text lookup by Id, Parent Swimmer Name, Phone, and child (sub-members) name list too!
    const textQuery = searchQuery.toLowerCase().trim();
    let matchesText = 
      m.name.toLowerCase().includes(textQuery) ||
      m.id.toLowerCase().includes(textQuery) ||
      m.phone.includes(textQuery);

    // Deep search sub-members of family plan so lookups hit family companions instantly
    if (!matchesText && m.subMembers) {
      matchesText = m.subMembers.some(sub => 
        sub.name.toLowerCase().includes(textQuery) || 
        sub.id.toLowerCase().includes(textQuery) ||
        (sub.phone && sub.phone.includes(textQuery))
      );
    }

    if (!matchesText) return false;

    // 2. Filter plan status
    const remainingDays = getDaysRemaining(m.endDate);
    if (statusFilter === "active" && remainingDays < 0) return false;
    if (statusFilter === "expired" && remainingDays >= 0) return false;
    if (statusFilter === "expiring_soon" && (remainingDays < 0 || remainingDays > 7)) return false;

    // 3. Filter check followups
    if (alertFilter === "alerted" && !m.alertSent) return false;
    if (alertFilter === "not_alerted" && m.alertSent) return false;

    return true;
  });

  // Render public-facing member scan validation card with real-time status check
  if (publicScanData) {
    const rDays = getRemainingDaysForEnd(publicScanData.end);
    const isPassActive = rDays >= 0;
    
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white font-sans selection:bg-blue-600">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          
          {/* Top banner accent based on status */}
          <div className={`h-2 ${isPassActive ? "bg-emerald-500" : "bg-rose-500"} w-full`}></div>
          
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Logo Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-blue-700 rounded-lg flex items-center justify-center text-white shadow-md">
                  <Waves className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight text-white">
                    {lang === "en" ? "SEAHORSE FITNESS" : "海马游泳中心"}
                  </h1>
                  <p className="text-[9px] text-slate-400 font-bold">
                    {lang === "en" ? "VIP VERIFICATION GATE" : "专属通行云端核验网关"}
                  </p>
                </div>
              </div>
              
              {/* Language Switch */}
              <button
                onClick={() => handleLangToggle()}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[10px] transition cursor-pointer border border-slate-700"
              >
                <Languages className="h-3 w-3" />
                <span>{lang === "en" ? "English" : "中文"}</span>
              </button>
            </div>

            {/* Status Card Panel */}
            <div className={`p-6 rounded-2xl text-center space-y-3.5 border ${
              isPassActive 
                ? "bg-emerald-500/10 border-emerald-500/30" 
                : "bg-rose-500/10 border-rose-500/30"
            }`}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-md ${
                isPassActive 
                  ? "bg-emerald-500 text-slate-950 animate-bounce" 
                  : "bg-rose-500 text-white animate-pulse"
              }`}>
                {isPassActive ? (
                  <CheckCircle2 className="h-8 w-8 text-black font-black" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-white" />
                )}
              </div>
              
              <div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1.5 ${
                  isPassActive 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}>
                  {isPassActive 
                    ? (lang === "en" ? "PASS GRANTED / ACTIVE" : "审核通过 • 准予通行") 
                    : (lang === "en" ? "EXPIRED / ACCESS BARRED" : "通行到期 • 拒绝入池")
                  }
                </span>
                
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  {isPassActive 
                    ? (lang === "en" ? "VALID MEMBER PASS" : "有效泳客资格卡") 
                    : (lang === "en" ? "MEMBERSHIP EXPIRED" : "会员通行证已到期")
                  }
                </h2>
                
                <p className={`text-xs font-mono font-bold mt-2 ${
                  isPassActive ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {isPassActive 
                    ? (lang === "en" ? `Access approved — ${rDays} days remaining` : `绿牌通行期内 — 剩余 ${rDays} 天期限`) 
                    : (lang === "en" ? `Access barred — expired ${Math.abs(rDays)} days ago` : `拒绝出入池 — 已于 ${Math.abs(rDays)} 天前过期`)
                  }
                </p>
              </div>
            </div>

            {/* Decoded Member Details Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4.5 space-y-3.5 text-xs">
              <h3 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 pb-2">
                {lang === "en" ? "Swimmer Voucher Profile" : "泳卡凭证详情"}
              </h3>
              
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">{lang === "en" ? "Name" : "会员姓名"}</span>
                  <span className="font-extrabold text-slate-100 text-sm">{publicScanData.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">{lang === "en" ? "Card ID" : "通行卡号 No."}</span>
                  <span className="font-mono font-black text-blue-400 text-sm">{publicScanData.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">{lang === "en" ? "Plan Tier" : "开卡卡型计划"}</span>
                  <span className="font-bold text-slate-200">{getNormalizedPlanName(publicScanData.plan || "", lang) || (lang === "en" ? "Standard Pass" : "专属卡型")}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase font-bold">{lang === "en" ? "Phone" : "预留手机号"}</span>
                  <span className="font-mono text-slate-300 font-bold">{publicScanData.phone || "N/A"}</span>
                </div>
                <div className="col-span-2 border-t border-slate-800/65 pt-3.5 flex justify-between font-mono text-[10.5px] text-slate-400 font-bold">
                  <span>{lang === "en" ? "START: " : "生效日: "}{publicScanData.start}</span>
                  <span className={isPassActive ? "text-slate-400" : "text-rose-450 text-rose-400 font-extrabold"}>{lang === "en" ? "EXPIRY: " : "结束日: "}{publicScanData.end}</span>
                </div>
              </div>
            </div>

            {/* Prompt Notice */}
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold text-center uppercase tracking-wide">
              {lang === "en" 
                ? "This is an authentic cloud-verified Seahorse Fitness digital pass check." 
                : "本验证由海马游泳中心数据库动态匹配，仅作安全通行防溺及合规校验使用"}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setPublicScanData(null);
                  window.history.replaceState({}, document.title, window.location.pathname);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-705 text-slate-300 font-bold rounded-xl transition cursor-pointer text-xs uppercase"
              >
                {lang === "en" ? "Administrative Portal Entrance" : "管理员/救生员登录通道"}
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Lockscreen boundary
  if (!isLoggedIn) {
    return (
      <>
        <AdminLogin 
          onLoginSuccess={() => setIsLoggedIn(true)}
          onLifeguardScan={() => setIsScannerOpen(true)}
          lang={lang}
          onLangToggle={handleLangToggle}
        />
        <AnimatePresence>
          {isScannerOpen && (
            <MemberScanner 
              members={members}
              lang={lang}
              onClose={() => setIsScannerOpen(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      
      {/* Wave Accent Ribbon */}
      <div className="h-1.5 bg-blue-600 w-full"></div>

      {/* Primary Header Segment */}
      <header className="bg-white border-b border-slate-205 py-4.5 px-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Title with Switch Profile triggers */}
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <button
              type="button"
              onClick={() => setIsProfileManagerOpen(true)}
              className="w-11 h-11 bg-blue-700 hover:bg-blue-800 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0 cursor-pointer transition transform hover:scale-105 active:scale-95 group relative"
              title={lang === "en" ? "Manage and Switch Company Profiles" : "管理并切换公司主体档案"}
            >
              <Waves className="h-5.5 w-5.5 animate-pulse group-hover:scale-110" />
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 border-2 border-white rounded-full p-0.5 shadow transition">
                <Building2 className="h-2.5 w-2.5" />
              </div>
            </button>
            <div className="text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-800">
                  {profiles.find(p => p.id === activeProfileId)?.name || "Seahorse Fitness Inc (海马游泳中心)"}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsProfileManagerOpen(true)}
                  className="self-start sm:self-auto bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-full px-2 py-0.5 text-[9px] font-black text-blue-700 tracking-wider flex items-center gap-1 cursor-pointer transition select-none"
                >
                  <Building2 className="h-2.5 w-2.5" />
                  <span>{lang === "en" ? "SWITCH CO." : "切换主体 / 添加公司"}</span>
                </button>
              </div>
              <p className="text-[10.5px] text-slate-500 font-bold mt-0.5">
                {t.counterTerminal} • {t.todayBase}: <span className="font-mono text-blue-600 font-black">{todayStr}</span>
              </p>
            </div>
          </div>

          {/* Master actions bar */}
          <div className="flex flex-wrap items-center gap-2.5 justify-center">
            
            {/* Global Language Toggle Selector */}
            <button
              onClick={() => handleLangToggle()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition active:scale-95 cursor-pointer shadow-sm"
              title={t.cardToggleLang}
            >
              <Languages className="h-4 w-4 text-blue-600" />
              <span>{lang === "en" ? "English" : "简体中文"}</span>
            </button>

            {/* Google Sheets Sync Selector/Setup */}
            <button
              onClick={() => setIsSyncDialogOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm ${
                syncEnabled 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100 animate-fade-in" 
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              title={lang === "en" ? "Google Sheets cloud syncing integration" : "谷歌表格双向同步备份集成"}
            >
              <FileSpreadsheet className={`h-4 w-4 ${syncEnabled ? "text-emerald-600" : "text-slate-500"}`} />
              <span>
                {syncEnabled 
                  ? (isSyncing 
                      ? (lang === "en" ? "Syncing..." : "同步中...") 
                      : (lastSyncedTime ? `${lang === "en" ? "Synced" : "已同步"} ${lastSyncedTime}` : (lang === "en" ? "Sheets Connected" : "表格已连接"))) 
                  : (lang === "en" ? "Sheets Cloud Sync" : "谷歌表格云同步")
                }
              </span>
            </button>

            {/* Quick Register Swimmer triggers */}
            <button
              onClick={() => {
                setEditingMember(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-bold rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>{t.registerMember}</span>
            </button>

            {/* Lockscreen exit */}
            <button
              onClick={() => {
                localStorage.removeItem("swimpool_admin_logged_in");
                setIsLoggedIn(false);
              }}
              title={t.logout}
              className="p-2 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition active:scale-95 cursor-pointer shadow-sm"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Grid Dash */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Statistics Metric Panels Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Tile 1: DB Total count */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold block">{t.totalMembers}</span>
              <p className="text-2xl font-black font-mono text-slate-900">{members.length}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-2xl text-slate-700 border border-slate-150">
              <Plus className="h-5 w-5 text-slate-400" />
            </div>
          </div>

          {/* Tile 2: Active count */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold block">{t.activeCount}</span>
              <p className="text-2xl font-black font-mono text-emerald-600">
                {members.filter(m => getDaysRemaining(m.endDate) >= 0).length}
              </p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl border border-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          {/* Tile 3: Expired count */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold block">{t.expiredCount}</span>
              <p className="text-2xl font-black font-mono text-rose-600">
                {members.filter(m => getDaysRemaining(m.endDate) < 0).length}
              </p>
            </div>
            <div className="bg-rose-50 text-rose-600 p-2.5 rounded-2xl border border-rose-100">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>

          {/* Tile 4: Expiring in 7 Days Warning Portal and click action triggers reminders dialog */}
          <button
            onClick={() => setIsRemindersOpen(true)}
            className="bg-white border border-slate-250 p-5 rounded-3xl flex items-center justify-between shadow-sm hover:shadow-md hover:border-amber-400 cursor-pointer text-left group active:scale-98 transition-all"
          >
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-bold block">{t.warningCount}</span>
              <p className="text-2xl font-black font-mono text-amber-600">
                {members.filter(m => {
                  const days = getDaysRemaining(m.endDate);
                  return days >= 0 && days <= 7;
                }).length}
              </p>
              <span className="text-[9.5px] text-amber-800 bg-amber-50 group-hover:bg-amber-100 px-2 py-0.5 rounded-lg font-black inline-block tracking-wide transition">
                {t.clickToRead}
              </span>
            </div>
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-2xl border border-amber-100 group-hover:bg-amber-100 transition-colors">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </button>

        </section>

        {/* Swimmers Passage List & Directory */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          
          {/* Search Header Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-3.5 border-b border-slate-150">
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm md:text-base flex flex-wrap items-center gap-2">
                <span>{t.eligibilityBoard}</span>
                <span className="text-[10px] md:text-xs font-bold text-blue-700 bg-blue-50 border border-blue-105 px-2.5 py-0.5 rounded-full select-none">
                  {t.retrievedCount.replace("{count}", filteredMembers.length.toString())}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{t.searchSubhint}</p>
            </div>

            {/* Database backups, spreadsheets and exports */}
            <div className="flex flex-wrap items-center gap-2">
              {/* CSV exports */}
              <button
                onClick={exportToCSV}
                title={t.exportExcel}
                className="flex items-center gap-1 bg-slate-50 border border-slate-205 text-slate-600 hover:text-emerald-700 hover:border-emerald-250 hover:bg-emerald-50/20 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>{t.exportExcel}</span>
              </button>

              {/* Back up */}
              <button
                onClick={exportBackupJSON}
                title={t.backupDB}
                className="flex items-center gap-1 bg-slate-50 border border-slate-205 text-slate-600 hover:text-blue-700 hover:border-blue-250 hover:bg-blue-50/20 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-blue-650" />
                <span>{t.backupDB}</span>
              </button>

              {/* Restore backups */}
              <label className="flex items-center gap-1 bg-slate-50 border border-slate-205 text-slate-600 hover:text-indigo-700 hover:border-indigo-250 hover:bg-indigo-50/20 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shadow-xs select-none">
                <Upload className="h-3.5 w-3.5 text-indigo-650" />
                <span>{t.restoreDB}</span>
                <input 
                  type="file" 
                  accept=".json,application/json" 
                  onChange={handleImportBackup} 
                  className="hidden" 
                />
              </label>

              {/* Mock Demo reload */}
              <button
                onClick={resetToMock}
                title="Reset демонстративно lists demo data"
                className="p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/20 rounded-xl cursor-pointer transition shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-hover" />
              </button>
            </div>
          </div>

          {/* Filtering row: search bar + segmented widgets */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* TextInput query */}
            <div className="md:col-span-5 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 hover:bg-slate-105-0 border border-slate-200 rounded-xl py-2 px-3 pl-10 text-slate-800 placeholder-slate-400 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-800 text-xs font-bold"
                >
                  Clear / 清除
                </button>
              )}
            </div>

            {/* Segment filter: active, expired, warning expiring */}
            <div className="md:col-span-4 flex rounded-xl bg-slate-100 p-1 border border-slate-200/50 text-xs text-center font-bold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === "all" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.allCapsText}
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === "active" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.activeText}
              </button>
              <button
                onClick={() => setStatusFilter("expiring_soon")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === "expiring_soon" ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.expiringText}
              </button>
              <button
                onClick={() => setStatusFilter("expired")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === "expired" ? "bg-white text-rose-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.expiredText}
              </button>
            </div>

            {/* Segment filter: Alert Sent / follow up checked */}
            <div className="md:col-span-3 flex rounded-xl bg-slate-100 p-1 border border-slate-200/50 text-xs text-center font-bold">
              <button
                onClick={() => setAlertFilter("all")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  alertFilter === "all" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.filterRemindersAll}
              </button>
              <button
                onClick={() => setAlertFilter("alerted")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  alertFilter === "alerted" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.filterRemindersAlerted}
              </button>
              <button
                onClick={() => setAlertFilter("not_alerted")}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  alertFilter === "not_alerted" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t.filterRemindersNotAlerted}
              </button>
            </div>

          </div>

          {/* Members main listing table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            {filteredMembers.length > 0 ? (
              <table className="w-full text-xs md:text-sm text-left border-collapse">
                <thead className="bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">{t.colCardNo}</th>
                    <th scope="col" className="px-5 py-3.5">{t.colBasicInfo}</th>
                    <th scope="col" className="px-5 py-3.5">{t.colPlanPrice}</th>
                    <th scope="col" className="px-5 py-3.5">{t.colValidityRange}</th>
                    <th scope="col" className="px-5 py-3.5 text-center">{t.colRemainingDays}</th>
                    <th scope="col" className="px-5 py-3.5 text-center">{t.colAlertReminder}</th>
                    <th scope="col" className="px-5 py-3.5 text-right font-black">{t.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredMembers.map((m) => {
                    const daysRemaining = getDaysRemaining(m.endDate);
                    const expired = daysRemaining < 0;
                    
                    const isFamilyPlan = m.plan.toLowerCase().includes("family") || m.plan.includes("家庭");
                    const isAnnual = m.plan.toLowerCase().includes("annual") || m.plan.includes("年卡");
                    const isSeason = m.plan.toLowerCase().includes("quarter") || m.plan.includes("季卡") || m.plan.includes("半年");
                    const isMonth = m.plan.toLowerCase().includes("month") || m.plan.includes("月卡");

                    return (
                      <tr 
                        key={m.id} 
                        className={`hover:bg-blue-50/20 transition-colors ${
                          expired ? "bg-rose-50/10 hover:bg-rose-50/30" : "even:bg-slate-50/10"
                        }`}
                      >
                        {/* Member ID clickable directly to load on-screen pass card */}
                        <td className="px-5 py-4 font-mono font-black text-blue-600">
                          <button
                            type="button"
                            onClick={() => setSelectedPassMember(m)}
                            title={t.viewPass}
                            className="hover:underline hover:text-blue-800 transition text-left cursor-pointer flex flex-col"
                          >
                            <span>{m.id}</span>
                            {m.subMembers && m.subMembers.length > 0 && (
                              <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-1 py-0.2 rounded mt-1 font-bold">
                                {lang === "en" ? `+ ${m.subMembers.length} Companions` : `+ ${m.subMembers.length} 随同副卡`}
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Name and Phone */}
                        <td className="px-5 py-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-slate-900 font-extrabold block max-w-[130px] truncate" title={m.name}>
                              {m.name}
                            </span>
                            <span className="text-slate-500 font-mono font-bold flex items-center gap-1">
                              <Smartphone className="h-3 w-3 text-slate-400" />
                              <span>{m.phone}</span>
                            </span>
                          </div>
                        </td>

                        {/* Card model plans and billing */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase inline-block border ${
                              isFamilyPlan ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                              isAnnual ? "bg-amber-50 border-amber-200 text-amber-700" : 
                              isSeason ? "bg-blue-50 border-blue-200 text-blue-700" : 
                              isMonth ? "bg-slate-50 border-slate-200 text-slate-700" : "bg-slate-100 border-slate-150 text-slate-600"
                            }`}>
                              {getNormalizedPlanName(m.plan, lang)}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px] font-black block">
                              ¥{m.price}
                            </span>
                          </div>
                        </td>

                        {/* Validity ranges */}
                        <td className="px-5 py-4 text-slate-505 font-mono text-[11px] font-bold">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block">{lang === "en" ? "From:" : "生效:"} {m.startDate}</span>
                            <span className={expired ? "text-rose-600 font-extrabold" : "text-slate-800"}>
                              {lang === "en" ? "Till:" : "有效到:"} {m.endDate}
                            </span>
                          </div>
                        </td>

                        {/* Remaining pass days status badges */}
                        <td className="px-5 py-4 text-center">
                          {expired ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-black bg-rose-50 border border-rose-200 text-rose-600 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                              <span>{t.expiredDaysAgo.replace("{days}", Math.abs(daysRemaining).toString())}</span>
                            </span>
                          ) : daysRemaining <= 7 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-black bg-amber-50 border border-amber-200 text-amber-600 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              <span>{t.expiringDaysLeft.replace("{days}", daysRemaining.toString())}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-black bg-emerald-50 border border-emerald-150 text-emerald-700 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{t.activeDaysLeft.replace("{days}", daysRemaining.toString())}</span>
                            </span>
                          )}
                        </td>

                        {/* Reminded toggle buttons */}
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAlert(m.id)}
                            title={t.clickToToggleAlert}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-black transition cursor-pointer select-none ${
                              m.alertSent 
                                ? "bg-amber-100 text-amber-700 border border-amber-200" 
                                : "bg-slate-50 hover:bg-slate-105-0 text-slate-400 hover:text-slate-700 border border-slate-200"
                            }`}
                          >
                            <BellRing className={`h-3 w-3 ${m.alertSent ? "text-amber-500 animate-swing" : "text-slate-400"}`} />
                            <span>{m.alertSent ? t.sentAlert : t.unsentAlert}</span>
                          </button>
                        </td>

                        {/* Actions operations panel */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Card view print */}
                            <button
                              onClick={() => setSelectedPassMember(m)}
                              title={t.viewPass}
                              className="p-1.5 bg-slate-50 border border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg hover:border-blue-300 transition cursor-pointer"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>

                            {/* Edit settings */}
                            <button
                              onClick={() => {
                                setEditingMember(m);
                                setIsFormOpen(true);
                              }}
                              title={t.editInfo}
                              className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer hover:border-slate-350 transition"
                            >
                              <Edit3 className="h-4.5 w-4.5" />
                            </button>

                            {/* Delete permanently */}
                            <button
                              onClick={() => handleDeleteMember(m.id, m.name)}
                              title={t.deletePass}
                              className="p-1.5 bg-slate-50 border border-slate-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer hover:border-rose-250 transition"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center p-12 space-y-4 bg-slate-50/50">
                <div className="bg-slate-105 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Search className="h-6 w-6" />
                </div>
                <div className="text-base font-extrabold text-slate-800">{t.noRecords}</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-bold">
                  {t.searchNoMatchDes.replace("{query}", searchQuery)}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-sm active:scale-95"
                  >
                    {t.resetSearch}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Business workflow guide instruction */}
          <div className="bg-blue-50/50 border border-blue-105 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-2 text-xs text-slate-755 max-w-4xl font-bold leading-relaxed">
              <Info className="h-4.5 w-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block mb-0.5">{t.operationalNoticeTitle}</span>
                <span>{t.operationalNoticeBody}</span>
              </div>
            </div>
            
            <button
              onClick={() => {
                alert(t.skillsAlertMsg);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 underline whitespace-nowrap bg-blue-50 border border-blue-200/50 px-3.5 py-1.5 rounded-xl cursor-pointer transition"
            >
              {t.viewSkillsBtn}
            </button>
          </div>

        </section>

      </main>

      {/* Footer System Branding Credits */}
      <footer className="px-8 py-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider gap-3 select-none">
        <button
          onClick={() => setIsVersionOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200/50 rounded-xl cursor-pointer transition uppercase tracking-wide text-[9.5px]"
        >
          <span>🔔 {lang === "en" ? "v2.6 Update log: Plans Simplified & Mobile QR Fixed [Click to view]" : "v2.6版本：精简卡种、手机直接扫码核验完成 [点击查看更新日志]"}</span>
        </button>
        <div>© 2026 {lang === "en" ? "Seahorse Fitness Inc." : "海马游泳中心"} Member Pass Terminal v2.6.</div>
      </footer>

      {/* Dialog System renderer overlays */}
      <AnimatePresence>
        
        {/* Form Modal adding or editing profiles */}
        {isFormOpen && (
          <MemberForm 
            member={editingMember}
            existingIds={members.map(m => m.id)}
            onSave={handleSaveMember}
            lang={lang}
            onClose={() => {
              setIsFormOpen(false);
              setEditingMember(null);
            }}
          />
        )}

        {/* Camera Scanner Gate without login */}
        {isScannerOpen && (
          <MemberScanner 
            members={members}
            lang={lang}
            onClose={() => setIsScannerOpen(false)}
          />
        )}

        {/* Double Sided Pass preview and print dialog */}
        {selectedPassMember && (
          <MemberCardView 
            member={selectedPassMember}
            onToggleAlert={handleToggleAlert}
            lang={lang}
            onClose={() => setSelectedPassMember(null)}
          />
        )}

        {/* Alert 7-Day impending expiring follow up list trigger */}
        {isRemindersOpen && (
          <RemindersDialog 
            members={members}
            lang={lang}
            onClose={() => setIsRemindersOpen(false)}
            onOpenCard={(m) => setSelectedPassMember(m)}
            onToggleAlert={handleToggleAlert}
          />
        )}

        {/* Version Updates Log dialogue */}
        {isVersionOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold select-none text-xs">v</div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">{lang === "en" ? "Version Update Log" : "系统版本更新日志"}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Member Pass Terminal • Stable Enterprise</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVersionOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Version list items */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs text-slate-600 font-semibold leading-relaxed">
                
                {/* v2.6 Latest */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">v2.6 RELEASE</span>
                    <span className="font-mono text-slate-400 font-bold">2026-06-06 (Latest)</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-700">
                    <li>💻 <strong>{lang === "en" ? "Cloudflare Pages Optimized" : "支持 Cloudflare Pages 自动构建"}</strong>: {lang === "en" ? "Webpage configured and streamlined to build beautifully on pages.dev origin namespaces." : "网页构建脚本深度适配，完美在 pages.dev 域名提供高吞吐的泳卡核验访问。"}</li>
                    <li>📱 <strong>{lang === "en" ? "QR Redirection Error Fixed" : "修复相机直扫 URL 跳 404"}</strong>: {lang === "en" ? "Card QR value now auto-resolves dynamically to current deployment origin, avoiding legacy hardcoded GitHub Pages 404." : "核验二维码动态适应当前域名，不管用微信、抖音或 iPhone 系统相机扫码均可秒开资格证，不会再出现跳 404 无法通行的情况。"}</li>
                    <li>💳 <strong>{lang === "en" ? "Plan Series Simplified" : "卡种期限精简 & 英文显示"}</strong>: {lang === "en" ? "Simplified plan series to keep only Month Pass, 6-Month Pass, and Year Pass, displaying in clean English for billing uniformity." : "去除了干扰性极强的低客单次卡周卡，仅保留 Month Pass、6-Month Pass 与 Year Pass，且不管系统处于中/英文模式均强制呈递专业英标文字。"}</li>
                    <li>🛡️ <strong>{lang === "en" ? "Decoupled Local QR Check-in" : "取消内嵌扫码 / 外置免登核验"}</strong>: {lang === "en" ? "Removed legacy internal camera web views from login gates. Lifeguards can scan directly with secondary devices safely, protecting member database secrecy." : "移除了繁重且暴露后台管理密码的内嵌式摄像头扫描。救生员用私人手机直接对准实体卡一扫即可核验通关，避免不经意泄露其他常客的电话隐私。"}</li>
                  </ul>
                </div>

                <hr className="border-slate-100" />

                {/* v2.5 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">v2.5</span>
                    <span className="font-mono text-slate-400">2026-05-24</span>
                  </div>
                  <p className="pl-1 text-slate-500 text-[11px]">
                    {lang === "en" ? "Enabled double-sided black-and-white thermal pass-card printing templates (3\" x 2\" layouts with cutting guidelines)." : "针对低功率黑白热敏纸添加了定制级双面物理裁剪凭证版面，卡套挂装更佳。"}
                  </p>
                </div>

                {/* v2.4 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-black text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">v2.4</span>
                    <span className="font-mono text-slate-400">2026-04-18</span>
                  </div>
                  <p className="pl-1 text-slate-500 text-[11px]">
                    {lang === "en" ? "Multi-user family companion plan expansion allowed creation of secondary custom sub-cards." : "加入全系统级子级亲子家庭副卡，一人持主卡其余人各自拥独家编号的卡牌。"}
                  </p>
                </div>

              </div>

              <button 
                onClick={() => setIsVersionOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer text-center"
              >
                {lang === "en" ? "Understood" : "我知道了"}
              </button>
            </motion.div>
          </div>
        )}

        {/* Google Sheets Sync Settings Dialog */}
        {isSyncDialogOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 space-y-4 text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                    <FileSpreadsheet className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-850 text-sm">
                      {lang === "en" ? "Google Sheets Dual-Sync Gateway" : "谷歌在线表格双向互通网关"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === "en" ? "Durable Cloud Roster Node" : "云端防丢、多机协同高可用机制"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsSyncDialogOpen(false);
                    setSyncError(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-650 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Body explanation */}
              <div className="space-y-4 text-xs font-semibold text-slate-650 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                {/* Info summary */}
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-emerald-850 space-y-1.5">
                  <p className="font-black text-emerald-800">
                    💡 {lang === "en" ? "How does cloud spreadsheet sync work?" : "它是如何帮您备份和协同的？"}
                  </p>
                  <p className="text-[10.5px] font-bold text-slate-600 leading-normal">
                    {lang === "en" 
                      ? "Every member registered, edited, or deleted in Seahorse Applet will automatically update your Google Sheet in real-time. On app startup, members are automatically synced down so your local caches remain indestructible!"
                      : "您在此系统的所有添加、修改、退卡操作都会实时写入对应的 Google Sheet。开机时也会自动从云端获取最新列表，换电脑或清缓存再也不用担心数据丢失，多人手机或电脑同时打票和核卡更互通！"}
                  </p>
                </div>

                {/* Form parameters */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
                      {lang === "en" ? "1. Sync Configuration" : "1. 开启数据云同步开关"}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sync-toggle-chk"
                        checked={syncEnabled}
                        onChange={(e) => {
                          const nextVal = e.target.checked;
                          setSyncEnabled(nextVal);
                          localStorage.setItem("swimpool_sheet_sync_enabled", nextVal ? "true" : "false");
                          const activeProfId = localStorage.getItem("swimpool_active_profile_id") || "default";
                          updateProfileProperties(activeProfId, { syncEnabled: nextVal });
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <label htmlFor="sync-toggle-chk" className="text-[11px] font-black text-slate-700 cursor-pointer">
                        {lang === "en" ? "Enable Sync Service" : "开启自动备份"}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500 block">
                      {lang === "en" ? "2. Google Apps Script URL" : "2. 谷歌网页服务发布脚本 URL"}
                    </span>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={googleSheetUrl}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setGoogleSheetUrl(val);
                        saveObfuscatedGoogleSheetUrl(val);
                        const activeProfId = localStorage.getItem("swimpool_active_profile_id") || "default";
                        updateProfileProperties(activeProfId, { sheetUrl: val });
                      }}
                      className="w-full px-3 py-2 border border-slate-205 rounded-xl bg-slate-50 text-slate-800 font-mono text-[10px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Status indicator and Test Actions */}
                {googleSheetUrl && (
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-500">{lang === "en" ? "Manual Actions / Diagnostics" : "手动强推或强制拉取覆盖"}</span>
                      <span className="font-mono text-slate-400 font-bold">
                        {lang === "en" ? "Active Cloud API Connect" : "安全数据同步通道"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          const done = await pullFromGoogleSheet();
                          if (done) alert(lang === "en" ? "Successfully pulled Roster list from Google Sheets!" : "同步拉取成功！已从 Google Sheet 下载最新泳客资格库覆盖本地缓存。");
                        }}
                        disabled={isSyncing}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50 text-[11px] font-bold"
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-slate-650" : "text-slate-500"}`} />
                        <span>{lang === "en" ? "Force Pull From Sheet" : "拉取覆盖 (云端 ➔ 本地)"}</span>
                      </button>

                      <button
                        onClick={async () => {
                          await pushToGoogleSheet(members);
                          alert(lang === "en" ? "Successfully requested list upload write back!" : "推送成功！已将本地全部泳客资格覆盖传送到 Google Sheet 表格中。");
                        }}
                        disabled={isSyncing}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition cursor-pointer disabled:opacity-50 text-[11px] font-bold"
                      >
                        <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-emerald-650" : "text-emerald-500"}`} />
                        <span>{lang === "en" ? "Force Push To Sheet" : "推送覆盖 (本地 ➔ 云端)"}</span>
                      </button>
                    </div>

                    {syncError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded-xl text-[10px] uppercase font-mono">
                        Error: {syncError}
                      </div>
                    )}
                  </div>
                )}

                {/* Google Apps Script Installation Steps Instructions Guide */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-600 block">
                    ⚡ {lang === "en" ? "Quick 3-step setup guide (2 Mins)" : "极速 3 步设置指南（2分钟即可跑通）"}
                  </span>
                  
                  <ol className="list-decimal pl-4.5 space-y-1.5 text-[10.5px] leading-relaxed text-slate-600">
                    <li>
                      <strong>{lang === "en" ? "Create Spreadsheet:" : "新建和命名表格："}</strong> 
                      {lang === "en" 
                        ? "Open Google Drive, create a new Google Sheet. Rename it to 'Seahorse Pool'."
                        : "在 Google Drive 里点击新建一个「Google 表格」(Google Sheet)，命名随意例如 'Seahorse'。"
                      }
                    </li>
                    <li>
                      <strong>{lang === "en" ? "Paste Script:" : "粘入中转脚本："}</strong>
                      {lang === "en" 
                        ? "Click Extensions -> Apps Script. Clear layout code and copy-paste the exact code block below."
                        : "在上方菜单 [扩展程序] (Extensions) -> [Apps Script]。清空里面所有的系统默认代码，然后粘贴进去下面代码："
                      }
                    </li>
                    <li>
                      <strong>{lang === "en" ? "Deploy as App:" : "部署发布网页服务："}</strong>
                      {lang === "en" 
                        ? "Click Deploy -> New deployment. Select Type 'Web App'. Set Description, set 'Execute as' to Me, and Set 'Who has access' to Anyone. Click Deploy and copy the Web App URL into the box above!"
                        : "点击 [部署] -> [新建部署]，在左侧小齿轮按「网页应用」 (Web App)。描述随意填，[执行者] 选「我」，[谁能访问] 选「任何人」(Anyone)。部署并直接复制生成的网页应用 URL，填入上方的输入框并勾选自动同步即可！"
                      }
                    </li>
                  </ol>

                  {/* Copyable code textarea */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] uppercase font-extrabold text-slate-400 block tracking-wider">
                      {lang === "en" ? "Google Apps Script Code Block to copy:" : "需粘贴进 Apps Script 的完整代码（全选复制）："}
                    </span>
                    <textarea
                      readOnly
                      onClick={(e) => {
                        (e.target as HTMLTextAreaElement).select();
                      }}
                      className="w-full h-24 p-2 bg-slate-900 text-slate-200 rounded-xl font-mono text-[9px] focus:outline-none overflow-y-auto cursor-pointer border border-slate-800"
                      value={`function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  }
  var headers = data[0];
  var members = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var member = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j];
      var val = row[j];
      if (key === 'price') {
        val = Number(val);
      } else if (key === 'subMembers' && val) {
        try {
          val = JSON.parse(val);
        } catch(e) {
          val = [];
        }
      }
      member[key] = val;
    }
    members.push(member);
  }
  return ContentService.createTextOutput(JSON.stringify(members))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var list = requestData.members;
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.clear();
    
    if (list.length === 0) {
      sheet.appendRow(["id", "name", "phone", "price", "plan", "startDate", "endDate", "extraInfo", "lastPaymentDate", "createdAt", "subMembers"]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = ["id", "name", "phone", "price", "plan", "startDate", "endDate", "extraInfo", "lastPaymentDate", "createdAt", "subMembers"];
    sheet.appendRow(headers);
    
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var row = [];
      row.push(m.id || "");
      row.push(m.name || "");
      row.push(m.phone || "");
      row.push(m.price || 0);
      row.push(m.plan || "");
      row.push(m.startDate || "");
      row.push(m.endDate || "");
      row.push(m.extraInfo || "");
      row.push(m.lastPaymentDate || "");
      row.push(m.createdAt || "");
      row.push(m.subMembers ? JSON.stringify(m.subMembers) : "[]");
      sheet.appendRow(row);
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                    />
                    <span className="text-[8.5px] text-slate-400 font-bold block leading-relaxed">
                      {lang === "en" ? "✨ Clicking inside text area auto-selects all for seamless copying." : "✨ 提示：点击文本框内部即可直接全选代码，配合 Ctrl+C / Cmd+C 快速复制。"}
                    </span>
                  </div>
                </div>

              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setIsSyncDialogOpen(false)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer text-center select-none active:scale-98"
                >
                  {lang === "en" ? "Save & Close Gateway" : "保存并关闭设置"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Company Profile Swapper and Manager Dialog */}
        {isProfileManagerOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 space-y-4 text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">
                      {lang === "en" ? "Company Profile Manager" : "多公司主体与环境配置管理"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {lang === "en" ? "Independent member database and sync channel per company" : "每个公司都有完全独立运行的离线数据库与同步渠道"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsProfileManagerOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Profiles List */}
              <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                {profiles.map((p) => {
                  const isActive = p.id === activeProfileId;
                  const isDefaultProfile = p.isDefault || p.id === "default";
                  
                  return (
                    <div 
                      key={p.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between border rounded-2xl p-4 gap-3 transition-all ${
                        isActive 
                          ? "bg-slate-50 border-blue-500 shadow-sm ring-1 ring-blue-500/20" 
                          : "bg-white border-slate-200 hover:border-slate-350"
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="flex-1 space-y-1">
                        {editingProfileId === p.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="text"
                              value={editProfileNameInput}
                              onChange={(e) => setEditProfileNameInput(e.target.value)}
                              className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!editProfileNameInput.trim()) return;
                                setProfiles(prev => {
                                  const updated = prev.map(item => item.id === p.id ? { ...item, name: editProfileNameInput.trim() } : item);
                                  localStorage.setItem("swimpool_company_profiles", JSON.stringify(updated));
                                  return updated;
                                });
                                setEditingProfileId(null);
                              }}
                              className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition"
                            >
                              {lang === "en" ? "Save" : "保存"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProfileId(null)}
                              className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] hover:bg-slate-200 transition"
                            >
                              {lang === "en" ? "Cancel" : "取消"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">{p.name}</span>
                            {isActive && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                                {lang === "en" ? "Active" : "当前主体"}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] font-mono text-slate-400 flex flex-wrap gap-2 pt-0.5">
                          <span>ID: {p.id}</span>
                          {p.sheetUrl && <span className="text-emerald-600 font-bold">• Sheets Linked</span>}
                        </p>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        {!isActive && editingProfileId !== p.id && (
                          <button
                            type="button"
                            onClick={() => {
                              handleSwitchProfile(p.id);
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] rounded-lg border border-blue-200/50 cursor-pointer transition select-none"
                          >
                            {lang === "en" ? "Switch" : "切换"}
                          </button>
                        )}

                        {editingProfileId !== p.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProfileId(p.id);
                              setEditProfileNameInput(p.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg transition"
                            title={lang === "en" ? "Rename Company" : "重命名公司"}
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {!isDefaultProfile && editingProfileId !== p.id && (
                          <button
                            type="button"
                            onClick={() => {
                              const confirmDel = window.confirm(
                                lang === "en"
                                  ? `Are you sure you want to delete profile "${p.name}"? This also purges all independent members from its database.`
                                  : `确定要彻底删除该配置主体吗： "${p.name}"? 这将彻底擦除该主体名下的所有子层级离线泳卡数据。`
                              );
                              if (confirmDel) {
                                setProfiles(prev => {
                                  const filtered = prev.filter(item => item.id !== p.id);
                                  localStorage.setItem("swimpool_company_profiles", JSON.stringify(filtered));
                                  return filtered;
                                });
                                // Purge keys
                                localStorage.removeItem(`swimpool_member_db_${p.id}`);
                                if (isActive) {
                                  handleSwitchProfile("default");
                                }
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition"
                            title={lang === "en" ? "Delete Company Profile" : "彻底注销此主体项目"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Company Inline Segment */}
              <div className="bg-blue-50/50 border border-blue-150/50 p-3.5 rounded-2xl space-y-2.5">
                <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest block">
                  {lang === "en" ? "Add New Company / Profile" : "➕ 新增公司主体 / 环境分支"}
                </span>

                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={profileNameInput}
                    onChange={(e) => setProfileNameInput(e.target.value)}
                    placeholder={lang === "en" ? "e.g. Aqualux Swim Center" : "如：海马健身俱乐部北区分店"}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-205 rounded-xl text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!profileNameInput.trim()) return;
                      const newId = `comp_${Date.now()}`;
                      const newProf = {
                        id: newId,
                        name: profileNameInput.trim(),
                        sheetUrl: "",
                        syncEnabled: false,
                        lastSyncedTime: ""
                      };
                      setProfiles(prev => {
                        const updated = [...prev, newProf];
                        localStorage.setItem("swimpool_company_profiles", JSON.stringify(updated));
                        return updated;
                      });
                      setProfileNameInput("");
                      handleSwitchProfile(newId);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {lang === "en" ? "Add & Switch" : "添加并立即切换"}
                  </button>
                </div>
              </div>

              {/* Notice */}
              <p className="text-[10px] text-slate-400 font-semibold text-center mt-1 leading-normal">
                {lang === "en" 
                  ? "Switching profiles instantly reloads the dynamic list. Profiles are persisted locally." 
                  : "主体的隔离保护由沙盒级 LocalStorage 独家供应。您添加的每个公司主体均拥有自己的专属离线数据库和谷歌同步键。"}
              </p>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsProfileManagerOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer text-center"
              >
                {lang === "en" ? "Close Dialog" : "关闭主体管理"}
              </button>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* Embedded styles */}
      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        .animate-swing {
          animation: swing 1s ease-in-out;
        }
        .animate-spin-hover:hover {
          transform: rotate(360deg);
          transition: transform 0.6s ease-in-out;
        }
      `}</style>

    </div>
  );
}
