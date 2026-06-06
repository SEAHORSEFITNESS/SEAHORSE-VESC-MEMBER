/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  X, 
  Clock, 
  Smartphone, 
  Eye, 
  MessageSquare, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Member } from "../types";
import { TRANSLATIONS, getNormalizedPlanName } from "../translations";
import { motion } from "motion/react";

interface RemindersDialogProps {
  members: Member[];
  onClose: () => void;
  onOpenCard: (member: Member) => void;
  onToggleAlert: (id: string) => void;
  lang?: "en" | "zh";
}

export default function RemindersDialog({ 
  members, 
  onClose, 
  onOpenCard, 
  onToggleAlert,
  lang = "en"
}: RemindersDialogProps) {
  const t = TRANSLATIONS[lang];
  const todayStr = new Date().toISOString().split("T")[0];
  const todayMs = new Date(todayStr).getTime();

  // Helper date calculations
  const getDaysRemaining = (endDateStr: string) => {
    const endMs = new Date(endDateStr).getTime();
    return Math.ceil((endMs - todayMs) / (1000 * 3600 * 24));
  };

  // Filter members expiring in 7 days
  const expiringMembers = members.filter(m => {
    const days = getDaysRemaining(m.endDate);
    return days >= 0 && days <= 7;
  });

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-amber-500/10">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600 border border-amber-200">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm md:text-base">{t.remindersTitle}</h3>
              <p className="text-xs text-amber-700 font-semibold">{t.remindersSubtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {expiringMembers.length > 0 ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex gap-2 items-start leading-relaxed font-medium">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-550 flex-shrink-0 mt-0.5" />
                <span>
                  {t.remindersBanner.replace("{count}", expiringMembers.length.toString())}
                </span>
              </div>

              {expiringMembers.map(m => {
                const days = getDaysRemaining(m.endDate);
                return (
                  <div 
                    key={m.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/30 transition flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm truncate max-w-[140px]">{m.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-250 text-[10px] font-black text-amber-700">
                          {t.expiringDaysLeft.replace("{days}", days.toString())}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono font-bold">
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                          {m.phone}
                        </span>
                        <span>{t.remindersPlan}: {getNormalizedPlanName(m.plan, lang)}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 font-medium">
                        {t.remindersAutomaticDeactivation.replace("{date}", m.endDate)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* View Card */}
                      <button
                        onClick={() => {
                          onOpenCard(m);
                          onClose();
                        }}
                        title={t.viewPass}
                        className="p-2 bg-white border border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 rounded-lg transition active:scale-95 cursor-pointer shadow-sm hover:shadow"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>

                      {/* Quick reminder message button */}
                      <button
                        onClick={() => {
                          const normalizedPlan = getNormalizedPlanName(m.plan, lang);
                          const msg = lang === "en" 
                            ? `Hello ${m.name}, this is Seahorse Fitness Inc. Your swimming membership pass (${normalizedPlan}) is set to expire on ${m.endDate}. To continue enjoying pool access, please stop by our counter or call us at 347-272-2822 to renew. Thank you!`
                            : `【海马游泳中心】尊贵的会员${m.name}，您的${normalizedPlan}即将于${m.endDate}到期，为了不影响您的日常入水及游泳体验，请您在空闲时间抽空前往柜台，或联系我们的客服（347-272-2822）办理续卡。祝您生活愉快！`;
                          
                          navigator.clipboard.writeText(msg);
                          alert(t.smsCopyAlert);
                          if (!m.alertSent) {
                            onToggleAlert(m.id);
                          }
                        }}
                        title={t.copyTemplateBtn}
                        className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-350 rounded-lg transition active:scale-95 cursor-pointer shadow-sm hover:shadow"
                      >
                        <MessageSquare className="h-4.5 w-4.5" />
                      </button>

                      {/* Flag remind */}
                      <button
                        onClick={() => onToggleAlert(m.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-black transition cursor-pointer select-none ${
                          m.alertSent
                            ? "bg-amber-100 text-amber-700 border-amber-250 hover:bg-amber-150/70"
                            : "bg-white hover:bg-slate-100/70 text-slate-600 border-slate-200"
                        }`}
                      >
                        {m.alertSent ? t.sentAlert : t.unsentAlert}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-4 space-y-3.5">
              <div className="bg-emerald-50 border border-emerald-150 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="font-extrabold text-slate-800 text-base">{t.remindersNoExpiring}</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-semibold">
                {t.remindersNoExpiringBody}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-150 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition active:scale-95"
          >
            {t.closeStation}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
