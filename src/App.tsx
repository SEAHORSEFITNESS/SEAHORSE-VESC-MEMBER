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
import { TRANSLATIONS } from "./translations";
import { 
  Plus, 
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
  Languages
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

export default function App() {
  // Global Bilingual System State defaulting to english as instructed
  const [lang, setLang] = useState<"en" | "zh">(() => {
    return (localStorage.getItem("swimpool_lang") as "en" | "zh") || "en";
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem("swimpool_admin_logged_in") === "true");
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

  // Sync translation triggers
  const handleLangToggle = (selectedVal?: "en" | "zh") => {
    const nextLang = selectedVal ? selectedVal : (lang === "en" ? "zh" : "en");
    setLang(nextLang);
    localStorage.setItem("swimpool_lang", nextLang);
  };

  const t = TRANSLATIONS[lang];

  // Retrieve storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("swimpool_member_db");
    if (stored) {
      try {
        setMembers(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse database, reloading defaults", e);
        setMembers(INITIAL_MOCK_MEMBERS);
      }
    } else {
      setMembers(INITIAL_MOCK_MEMBERS);
      localStorage.setItem("swimpool_member_db", JSON.stringify(INITIAL_MOCK_MEMBERS));
    }
  }, []);

  // Save updates helper
  const saveMembersList = (updated: Member[]) => {
    setMembers(updated);
    localStorage.setItem("swimpool_member_db", JSON.stringify(updated));
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
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-11 h-11 bg-blue-700 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Waves className="h-5.5 w-5.5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">
                {t.chineseName} <span className="text-slate-400 font-light text-sm">| {lang === "en" ? "VIP Admin" : "核验云端"}</span>
              </h1>
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

            {/* Lifeguard Scan triggers */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs md:text-sm font-bold rounded-xl shadow transition active:scale-95 cursor-pointer"
            >
              <QrCode className="h-4 w-4 text-blue-400" />
              <span>{lang === "en" ? "Lifeguard Scanner" : "救生员扫码区"}</span>
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
                              {m.plan}
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
      <footer className="px-8 py-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-450 font-black uppercase tracking-wider gap-2 select-none">
        <div>{lang === "en" ? "Lifeguard Fast Validation Gate Activated • Local SQLite Storage Enabled" : "救生员高保真核验端已激活 • 兼容网页及桌面离线系统"}</div>
        <div>© 2026 {lang === "en" ? "Seahorse Fitness Inc." : "海马游泳中心"} Member Pass Terminal v2.5.</div>
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
