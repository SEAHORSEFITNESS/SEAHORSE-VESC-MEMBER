/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { 
  X, 
  Printer, 
  Calendar, 
  Smartphone, 
  User, 
  DollarSign, 
  BellRing,
  Clock,
  Languages,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { Member, SubMember } from "../types";
import { TRANSLATIONS, getNormalizedPlanName } from "../translations";
import { motion, AnimatePresence } from "motion/react";

interface MemberCardViewProps {
  member: Member;
  onClose: () => void;
  onToggleAlert: (id: string) => void;
  lang?: "en" | "zh"; // Optional global language state
}

export default function MemberCardView({ member, onClose, onToggleAlert, lang: initialLang = "en" }: MemberCardViewProps) {
  // Use local language switcher defaulting to provided language setting
  const [lang, setLang] = useState<"en" | "zh">(initialLang);
  const [activeCardSide, setActiveCardSide] = useState<"front" | "back">("front");
  
  // Track selected card holder (supports Family sub-members)
  const [selectedHolderId, setSelectedHolderId] = useState<string>(member.id);

  const t = TRANSLATIONS[lang];

  // Identify selected cardholder details
  const isPrincipalSelected = selectedHolderId === member.id;
  const selectedSub = member.subMembers?.find(sub => sub.id === selectedHolderId);

  const selectedMemberName = isPrincipalSelected ? member.name : (selectedSub?.name || member.name);
  const selectedMemberId = isPrincipalSelected ? member.id : (selectedSub?.id || member.id);
  const selectedMemberPhone = isPrincipalSelected ? member.phone : (selectedSub?.phone || member.phone || "无");
  const selectedRelationship = isPrincipalSelected ? "" : (selectedSub?.relationship || "");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayMs = new Date(todayStr).getTime();
  const endMs = new Date(member.endDate).getTime();
  const daysDiff = Math.ceil((endMs - todayMs) / (1000 * 3600 * 24));
  const isExpired = daysDiff < 0;

  // Encode candidate verification credentials in QR value matching our GitHub Pages system URL format
  const encodedName = encodeURIComponent(selectedMemberName);
  const encodedId = encodeURIComponent(selectedMemberId);
  const encodedStart = encodeURIComponent(member.startDate);
  const encodedEnd = encodeURIComponent(member.endDate);
  const encodedPhone = encodeURIComponent(selectedMemberPhone || "无");
  const encodedPlan = encodeURIComponent(getNormalizedPlanName(member.plan, lang));

  // Direct verifiable online link dynamically resolved to current deployment origin
  const currentOrigin = typeof window !== "undefined" ? (window.location.origin + window.location.pathname) : "https://seahorse-vesc-member.pages.dev/";
  const qrValue = `${currentOrigin}?id=${encodedId}&name=${encodedName}&start=${encodedStart}&end=${encodedEnd}&phone=${encodedPhone}&plan=${encodedPlan}`;

  // Custom high-fidelity high-contrast monochrome printing system (2 cards: Front + Back)
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const companyHeader = `
        <div style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.1px; color: #000000; line-height: 1.15; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; text-transform: uppercase;">SEAHORSE FITNESS INC</div>
        <div style="font-size: 6px; font-weight: 700; color: #111111; line-height: 1.15; margin-top: 1.5px; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;">
          69 Columbia St, NY 10002 • Cell: 347-272-2822
        </div>
      `;

      const nameLabel = "GUEST NAME";
      const phoneLabel = "TELEPHONE";
      const cardIdLabel = "CARD NUMBER";
      const dateLabel = "SWIM PASS VALIDITY PERIOD";

      const backFooter = "SCAN QR CODE TO VERIFY PASS ELIGIBILITY";

      // High-contrast, background-independent badges with solid/dashed borders for maximum thermal/B&W printing compatibility
      const badgeHTML = isPrincipalSelected ? "" : `
        <div style="font-size: 7px; font-weight: 900; border: 1.5px solid #000000; padding: 2.5px 5.5px; border-radius: 3px; background: #ffffff; color: #000000 !important; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; text-transform: uppercase; letter-spacing: 0.2px;">
          FAMILY PASS
        </div>
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en" class="notranslate">
          <head>
            <meta charset="UTF-8">
            <meta name="google" content="notranslate">
            <title>Print Pass - ${selectedMemberName}</title>
            <style>
              body { 
                margin: 0; 
                padding: 40px 20px; 
                display: flex; 
                flex-direction: column;
                justify-content: center; 
                align-items: center; 
                gap: 50px;
                background-color: #ffffff;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              
              /* Exact 3in x 2in standard printed card wrapper with only a clean dashed boundary line for scissors folding/cutting */
              .print-card-outer {
                width: 3.1in;
                height: 2.1in;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 1px dashed #000000;
                position: relative;
                box-sizing: border-box;
                padding: 0.05in;
                page-break-inside: avoid;
              }

              .print-card-container {
                width: 3in !important;
                height: 2in !important;
                position: relative !important;
                box-sizing: border-box !important;
                border: 2px solid #000000 !important;
                border-radius: 6px !important;
                overflow: hidden !important;
                padding: 0.12in !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
                color: #000000 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .print-info-row {
                margin-top: 3px;
                border-top: 1.5px solid #000000;
                padding-top: 4.5px;
              }

              .print-info-label {
                font-size: 6.5px;
                font-weight: 800;
                color: #000000;
                text-transform: uppercase;
                letter-spacing: 0.2px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
              }

              .print-info-val {
                font-size: 11px;
                font-weight: 900;
                color: #000000;
                line-height: 1.2;
              }

              @media print {
                body {
                  padding: 0;
                  background-color: #ffffff;
                }
                @page {
                  size: auto;
                  margin: 0.5in;
                }
              }
            </style>
          </head>
          <body onload="setTimeout(function(){ window.print(); window.close(); }, 350);">
            
            <!-- 1. FRONT CARD SECTION -->
            <div class="print-card-outer">
               <div class="print-card-container">
                <!-- Company Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000000; padding-bottom: 4px; box-sizing: border-box; width: 100%;">
                  <div style="flex: 1; min-width: 0; padding-right: 4px; box-sizing: border-box; text-align: left;">
                    ${companyHeader}
                  </div>
                  <div style="flex-shrink: 0; text-align: right;">
                    ${badgeHTML}
                  </div>
                </div>

                <!-- Fields -->
                <div style="margin-top: 5px; display: flex; flex-direction: column; justify-content: center; flex-grow: 1; padding: 2px 0; box-sizing: border-box;">
                  <div style="margin-bottom: 2px;">
                    <span style="font-size: 10px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.2px; font-family: system-ui, -apple-system, sans-serif;">${nameLabel}:</span>
                    <div style="font-size: 26px; font-weight: 950; font-family: system-ui, -apple-system, sans-serif; text-transform: uppercase; border-bottom: 2px solid #000000; padding-bottom: 1px; color: #000000; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;">
                      ${selectedMemberName}
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; width: 100%;">
                    <div style="text-align: left;">
                      <span class="print-info-label">${phoneLabel}:</span>
                      <div class="print-info-val" style="font-family: monospace, SFMono-Regular, Consolas, sans-serif; font-size: 9.5px; font-weight: 850; color: #000000;">${selectedMemberPhone}</div>
                    </div>
                    <div style="text-align: right;">
                      <span class="print-info-label">${cardIdLabel}:</span>
                      <div class="print-info-val" style="font-family: monospace, SFMono-Regular, Consolas, sans-serif; font-size: 9.5px; font-weight: 900; background: #ffffff; padding: 1.5px 4.5px; border-radius: 2px; color: #000000; border: 1.5px solid #000000; display: inline-block;">${selectedMemberId}</div>
                    </div>
                  </div>
                </div>

                <!-- Footer Exp times -->
                <div class="print-info-row" style="display: flex; justify-content: flex-start; align-items: flex-end; box-sizing: border-box; width: 100%;">
                  <div style="text-align: left;">
                    <span class="print-info-label">${dateLabel}:</span>
                    <div style="font-size: 10.5px; font-weight: 900; font-family: monospace, SFMono-Regular, Consolas, sans-serif; color: #000000; margin-top: 1.5px;">
                      ${member.startDate} <span style="font-weight: 800;">~</span> ${member.endDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
 
            <!-- 2. BACK CARD SECTION IN REVOLUTIONARY LEFT-RIGHT SPLIT -->
            <div class="print-card-outer" style="margin-top: 40px;">
              <div class="print-card-container">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; height: 100%; width: 100%; box-sizing: border-box; gap: 8px;">
                  
                  <!-- Left side of back: Maximize QR code occupying the entire left section -->
                  <div style="flex: 0 0 1.25in; display: flex; align-items: center; justify-content: center; height: 1.25in; width: 1.25in; border: 2px solid #000000; padding: 2px; border-radius: 5px; box-sizing: border-box; overflow: hidden; background: #ffffff;">
                    <div id="qr-target-print-back" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"></div>
                  </div>

                  <!-- Right side of back: text information, identifier & guidelines -->
                  <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; text-align: left; padding: 2px 0; min-width: 0;">
                    <div>
                      <div style="font-size: 8px; font-weight: 900; line-height: 1.1; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; color: #000000; text-transform: uppercase; letter-spacing: 0.1px;">
                        SEAHORSE FITNESS INC
                      </div>
                      <div style="font-size: 5.5px; color: #111111; line-height: 1.15; margin-top: 1.5px; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;">
                        69 Columbia St, NY 10002 • 347-272-2822
                      </div>
                    </div>

                    <div style="margin: 3px 0; padding-top: 3.5px; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; min-width: 0;">
                      <div style="font-size: 6px; text-transform: uppercase; font-weight: 800; color: #111111; letter-spacing: 0.1px; font-family: system-ui, sans-serif;">
                        CARD HOLDER
                      </div>
                      <div style="font-size: 11px; font-weight: 950; margin-top: 1px; text-transform: uppercase; font-family: system-ui, sans-serif; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #000000;">
                        ${selectedMemberName}
                      </div>
                      <div style="font-size: 7.5px; font-family: monospace, SFMono-Regular, Consolas, sans-serif; font-weight: 900; background: #ffffff; color: #000000 !important; display: inline-block; padding: 1.5px 4.5px; margin-top: 2.5px; border-radius: 2px; width: fit-content; border: 1.5px solid #000000;">
                        ID: ${selectedMemberId}
                      </div>
                    </div>

                    <div style="font-size: 5.5px; font-weight: 900; line-height: 1.25; padding-top: 3px; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; color: #000000;">
                      ${backFooter}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <script>
              try {
                const parentQr = window.opener.document.querySelector("#swim-member-card-hidden-back canvas");
                if (parentQr) {
                  const img = document.createElement("img");
                  img.src = parentQr.toDataURL("image/png");
                  img.style.width = "1.2in";
                  img.style.height = "1.2in";
                  img.style.display = "block";
                  document.getElementById("qr-target-print-back").appendChild(img);
                }
              } catch(e) {
                console.error("Cloning parent Canvas QR code state failed", e);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

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
        className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                {t.cardVoucherTitle}
              </h3>
              <p className="text-[10.5px] text-slate-500">
                {t.cardVoucherSub}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === "en" ? "zh" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition active:scale-95 cursor-pointer border border-blue-150 animate-pulse"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{lang === "en" ? "English" : "简体中文"}</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          
          {/* Family sub members pick dropdown */}
          {member.subMembers && member.subMembers.length > 0 && (
            <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-blue-600" />
                <span>{t.holderSelectorLabel}</span>
              </label>
              <select
                value={selectedHolderId}
                onChange={(e) => setSelectedHolderId(e.target.value)}
                className="w-full bg-white border border-blue-200 text-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={member.id}>
                  {t.holderPrincipalName.replace("{id}", member.id)}
                </option>
                {member.subMembers.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {t.holderSubName.replace("{id}", sub.id).replace("{relationship}", sub.relationship)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Card Side Toggle selector */}
          <div className="flex items-center justify-center p-0.5 bg-slate-100 rounded-xl max-w-sm mx-auto border border-slate-200">
            <button
              onClick={() => setActiveCardSide("front")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeCardSide === "front" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
            >
              {t.btnShowFront}
            </button>
            <button
              onClick={() => setActiveCardSide("back")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeCardSide === "back" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
            >
              {t.btnShowBack}
            </button>
          </div>

          {/* Printable Card Preview Box containing active selected card */}
          <div className="flex flex-col items-center justify-center py-2">
            
            <div className="w-full flex items-center justify-center p-6 bg-slate-50 border border-slate-200/80 rounded-2xl min-h-[250px] relative">
              
              <AnimatePresence mode="wait">
                {activeCardSide === "front" ? (
                  /* FRONT CARD PREVIEW WITH MEGA MAXIMIZED VISIBLE DETAILS */
                  <motion.div 
                    key="front-card"
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -90 }}
                    transition={{ duration: 0.3 }}
                    className="w-[300px] h-[200px] rounded-2xl relative overflow-hidden bg-white border-2 border-black p-3.5 flex flex-col justify-between text-black shadow-lg select-none"
                  >
                    {/* Top logo & info section */}
                    <div className="flex justify-between items-start border-b-2 border-black pb-2">
                      <div>
                        <h4 className="text-[12px] font-black tracking-wide leading-tight text-black">
                          {lang === "en" ? "SEAHORSE FITNESS INC" : "海马游泳中心"}
                        </h4>
                        <p className="text-[7.5px] text-slate-700 font-bold leading-normal mt-0.5">
                          69 Columbia St, NY, New York. 10002
                        </p>
                      </div>
                      {!isPrincipalSelected && (
                        <span className="px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-wider uppercase border border-black bg-white text-black">
                          FAMILY PASS
                        </span>
                      )}
                    </div>

                    {/* Mid User Details - FULLY MAXIMIZED NAME SIZING AS MANDATED */}
                    <div className="my-auto py-1 flex flex-col justify-center">
                      <span className="text-[10px] font-black tracking-wide text-black block uppercase">
                        GUEST NAME:
                      </span>
                      <h3 className="text-2xl md:text-[26px] font-black leading-none uppercase tracking-tight text-black border-b-2 border-black pb-0.5 my-1">
                        {selectedMemberName}
                      </h3>
                      
                      <div className="flex justify-between text-[9px] font-mono font-bold text-slate-800 mt-0.5">
                        <span>{lang === "en" ? "PHONE:" : "联系手机:"} {selectedMemberPhone}</span>
                        <span className="bg-slate-100 px-1 rounded border border-slate-200">ID: {selectedMemberId}</span>
                      </div>
                    </div>

                    {/* Footer dates enlarged to maximize poor B&W thermal printing visibility */}
                    <div className="border-t-2 border-black pt-1.5 flex justify-start items-end">
                      <div className="font-mono leading-tight">
                        <span className="text-[7px] text-slate-500 block font-extrabold leading-none uppercase">
                          {lang === "en" ? "VALID DATES DURATION" : "资格起止有效期段"}
                        </span>
                        <span className="text-[11.5px] font-black block tracking-tighter">
                          {member.startDate} ~ {member.endDate}
                        </span>
                      </div>
                    </div>

                    {/* Sub account identifier helper text */}
                    {!isPrincipalSelected && (
                      <div className="absolute right-2 top-10 text-[6.5px] bg-slate-150/80 px-1 py-0.2 rounded font-semibold text-slate-600">
                        {t.subMemberDetails.replace("{name}", member.name)}
                      </div>
                    )}

                  </motion.div>
                ) : (
                  /* BACK COUPLING - NOVEL LEFT-RIGHT HORIZONTAL SPLIT WITH MASSIVE QR CODE */
                  <motion.div 
                    key="back-card"
                    initial={{ opacity: 0, rotateY: -90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 90 }}
                    transition={{ duration: 0.3 }}
                    className="w-[300px] h-[200px] rounded-2xl relative overflow-hidden bg-white border-2 border-black p-3.5 flex flex-col justify-between text-black shadow-lg select-none"
                  >
                    <div className="flex flex-row items-center justify-between h-full w-full gap-3">
                      
                      {/* Left portion: Huge QR Code taking full column height */}
                      <div className="flex-shrink-0 flex items-center justify-center p-1.5 border-2 border-black rounded-xl bg-white shadow-sm">
                        <QRCodeCanvas 
                          value={qrValue} 
                          size={110} 
                          level="H" 
                          includeMargin={false}
                        />
                      </div>

                      {/* Right portion: identifying metrics and business tag */}
                      <div className="flex-1 flex flex-col justify-between h-full text-left py-0.5">
                        <div>
                          <h4 className="text-[9.5px] font-black tracking-wide leading-tight text-black flex items-center gap-1">
                            {lang === "en" ? "SEAHORSE FITNESS" : "海马游泳中心"}
                          </h4>
                          <span className="text-[5.5px] text-slate-500 font-bold block leading-normal mt-0.5">
                            69 Columbia St, NY, NY 10002
                            <br />Cell: 347-272-2822
                          </span>
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 flex-grow flex flex-col justify-center">
                          <span className="text-[6.5px] font-bold text-slate-700 block uppercase">
                            Card Holder
                          </span>
                          <span className="text-[12.5px] font-black uppercase text-black font-sans leading-tight">
                            {selectedMemberName}
                          </span>
                          <span className="font-mono text-[7px] uppercase font-bold text-white bg-black px-1.5 py-0.5 rounded mt-1.5 block w-fit">
                            ID: {selectedMemberId}
                          </span>
                        </div>

                        <div className="border-t border-black pt-1.5">
                          <span className="text-[6.5px] font-bold text-slate-700 leading-tight block font-mono">
                            {t.scanVerText}
                          </span>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* Invisible QR specifically dedicated for print clone tracking */}
            <div id="swim-member-card-hidden-back" className="hidden">
              <QRCodeCanvas 
                value={qrValue} 
                size={220} 
                level="H" 
                includeMargin={false}
              />
            </div>

          </div>

          {/* Quick Stats Panel */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 gap-4 text-xs md:text-sm text-slate-700">
            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-semibold">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                {t.cardDaysRemaining}
              </span>
              <p className={`font-mono text-base font-black ${isExpired ? "text-rose-600" : "text-emerald-600"}`}>
                {isExpired 
                  ? t.expiredDaysAgo.replace("{days}", Math.abs(daysDiff).toString())
                  : t.activeDaysLeft.replace("{days}", daysDiff.toString())}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-semibold">
                <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                {t.cardPaid}
              </span>
              <p className="font-mono text-base font-black text-blue-600">
                ¥{member.price}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-semibold">
                <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                {t.remindersPhone}
              </span>
              <p className="font-mono text-slate-800 font-bold">{selectedMemberPhone || "N/A"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 flex items-center gap-1 font-semibold">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                {t.cardPaymentDate}
              </span>
              <p className="font-mono text-slate-800 font-bold">{member.lastPaymentDate || "N/A"}</p>
            </div>

            <div className="col-span-2 border-t border-slate-200 pt-3 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1 font-semibold">
                <BellRing className="h-3.5 w-3.5 text-blue-600" />
                {t.cardAlertState}
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${member.alertSent ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-slate-200 text-slate-500"}`}>
                  {member.alertSent ? t.sentAlert : t.unsentAlert}
                </span>
                <button
                  onClick={() => onToggleAlert(member.id)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition font-bold hover:text-slate-800 cursor-pointer border border-slate-250 border-dashed"
                >
                  {t.cardEditState}
                </button>
              </div>
            </div>

            {/* Public Link Copy Area */}
            <div className="col-span-2 border-t border-slate-200 pt-3 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">🌐 {t.cardPublicLink}</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={qrValue} 
                  className="bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl text-[10.5px] font-mono text-slate-600 flex-1 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(qrValue);
                    alert(t.cardSmsCopied);
                  }}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-xl text-xs cursor-pointer font-bold transition-all active:scale-95"
                >
                  {t.cardCopyLink}
                </button>
              </div>
            </div>

            {member.extraInfo && (
              <div className="col-span-2 border-t border-slate-200 pt-3 space-y-1">
                <span className="text-slate-500 font-bold block">{t.cardNotesRemarks}:</span>
                <p className="bg-slate-100/50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 text-xs leading-relaxed font-medium">{member.extraInfo}</p>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex gap-4">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-md hover:shadow-lg text-sm transition-all transform active:scale-[0.99]"
            >
              <Printer className="h-4 w-4" />
              <span>{t.btnPrintDouble}</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl transition cursor-pointer text-sm"
            >
              {t.btnCloseCard}
            </button>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
