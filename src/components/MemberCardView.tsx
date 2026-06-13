/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
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
  UserPlus,
  Download,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Member, SubMember } from "../types";
import { TRANSLATIONS, getNormalizedPlanName } from "../translations";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface MemberCardViewProps {
  member: Member;
  onClose: () => void;
  onToggleAlert: (id: string) => void;
  lang?: "en" | "zh"; // Optional global language state
}

export default function MemberCardView({ member, onClose, onToggleAlert, lang: initialLang = "en" }: MemberCardViewProps) {
  // Use local language switcher defaulting to provided language setting
  const [lang, setLang] = useState<"en" | "zh">(initialLang);
  const [activeCardSide, setActiveCardSide] = useState<"front" | "back">(member.subMembers && member.subMembers.length > 0 ? "front" : "back");
  
  // Track selected card holder (supports Family sub-members)
  const [selectedHolderId, setSelectedHolderId] = useState<string>(member.id);

  // Simplified QR layout state (by default true to immediately resolve user density complaint)
  const [simplifyQr, setSimplifyQr] = useState<boolean>(true);

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
  
  // Custom QR string compression: if simplified, omit phone & plan metadata to reduce visual bit density by over 50%
  const qrValue = simplifyQr
    ? `${currentOrigin}?id=${encodedId}&name=${encodedName}&start=${encodedStart}&end=${encodedEnd}`
    : `${currentOrigin}?id=${encodedId}&name=${encodedName}&start=${encodedStart}&end=${encodedEnd}&phone=${encodedPhone}&plan=${encodedPlan}`;

  const [downloadFormat, setDownloadFormat] = useState<"PDF" | "JPG">("JPG");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{current: number, total: number} | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);

    const holders = [
      {
        id: member.id,
        name: member.name,
        phone: member.phone || "None",
        isPrincipal: true,
      },
      ...(member.subMembers || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        phone: sub.phone || member.phone || "None",
        isPrincipal: false,
      }))
    ];

    setDownloadProgress({ current: 0, total: holders.length });

    try {
      for (let i = 0; i < holders.length; i++) {
        const holder = holders[i];
        setDownloadProgress({ current: i + 1, total: holders.length });

        // Let the DOM update and image load
        await new Promise((resolve) => setTimeout(resolve, 250));

        if (downloadFormat === "JPG") {
          const combinedElement = document.getElementById(`download-card-combined-${holder.id}`);
          if (combinedElement) {
            const canvas = await html2canvas(combinedElement, {
              scale: 3,
              useCORS: true,
              backgroundColor: "#ffffff",
              logging: false,
            });
            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            
            const link = document.createElement("a");
            link.href = imgData;
            link.download = `${holder.name}_swim_pass.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else {
          const frontElement = document.getElementById(`download-card-front-${holder.id}`);
          const backElement = document.getElementById(`download-card-back-${holder.id}`);

          if (frontElement && backElement) {
            const pdf = new jsPDF({
              orientation: "landscape",
              unit: "in",
              format: [3.1, 2.1],
            });

            // Page 1: Front
            const frontCanvas = await html2canvas(frontElement, {
              scale: 3,
              useCORS: true,
              backgroundColor: "#ffffff",
              logging: false,
            });
            const frontImgData = frontCanvas.toDataURL("image/jpeg", 0.95);
            pdf.addImage(frontImgData, "JPEG", 0.05, 0.05, 3.0, 2.0);

            // Page 2: Back
            pdf.addPage([3.1, 2.1], "landscape");
            const backCanvas = await html2canvas(backElement, {
              scale: 3,
              useCORS: true,
              backgroundColor: "#ffffff",
              logging: false,
            });
            const backImgData = backCanvas.toDataURL("image/jpeg", 0.95);
            pdf.addImage(backImgData, "JPEG", 0.05, 0.05, 3.0, 2.0);

            pdf.save(`${holder.name}_swim_pass.pdf`);
          }
        }
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Download error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      alert(lang === "zh" 
        ? `生成下载文件失败，请重新加载页面或重试！\n错误详情: ${errMsg}` 
        : `Failed to compile download files, please refresh or try again.\nError details: ${errMsg}`
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Custom high-fidelity high-contrast monochrome printing system (multiple cards: Front + Back on one page)
  const handlePrint = () => {
    // Collect all cards to print: main member + all sub-members
    const itemsToPrint = [
      {
        id: member.id,
        name: member.name,
        phone: member.phone || "None",
        isPrincipal: true,
        qrElementId: "swim-qr-print-main"
      },
      ...(member.subMembers || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        phone: sub.phone || member.phone || "None",
        isPrincipal: false,
        qrElementId: `swim-qr-print-${sub.id}`
      }))
    ];

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      try {
        // Force UTF-8 encoding configuration on local document stream
        (printWindow.document as any).charset = "UTF-8";
      } catch (e) {
        console.error("Charset write warning", e);
      }

      const cardsHTML = itemsToPrint.map(item => {
        let qrDataUrl = "";
        const canvas = document.getElementById(item.qrElementId) as HTMLCanvasElement;
        if (canvas) {
          try {
            qrDataUrl = canvas.toDataURL("image/png");
          } catch (e) {
            console.error("Error drawing canvas for print", e);
          }
        }

        // Final fallback to any valid canvas if specific one is empty
        if (!qrDataUrl) {
          const fallbackCanvas = document.querySelector("#swim-member-card-hidden-back canvas") as HTMLCanvasElement;
          if (fallbackCanvas) {
            try {
              qrDataUrl = fallbackCanvas.toDataURL("image/png");
            } catch (fallbackErr) {
              // ignore
            }
          }
        }

        const companyHeader = `<div style="font-size: 9.5px; font-weight: 900; letter-spacing: 0.1px; color: #000000; line-height: 1.15; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; text-transform: uppercase;">SEAHORSE FITNESS INC</div>
             <div style="font-size: 6px; font-weight: 700; color: #111111; line-height: 1.15; margin-top: 1.5px; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;">
               69 Columbia St, NY 10002 • Cell: 347-272-2822
             </div>`;

        const nameLabel = "GUEST NAME";
        const phoneLabel = "TELEPHONE";
        const cardIdLabel = "CARD NUMBER";
        const dateLabel = "SWIM PASS VALIDITY PERIOD";
        const backFooter = "SCAN QR CODE TO VERIFY PASS ELIGIBILITY";

        // High-contrast physical badge for child/sub members in package - always in English to prevent printer driver failures
        const badgeHTML = item.isPrincipal ? "" : `
          <div style="font-size: 7px; font-weight: 900; border: 1.5px solid #000000; padding: 2px 4px; border-radius: 3px; background: #ffffff; color: #000000 !important; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; text-transform: uppercase; letter-spacing: 0.2px; text-align: center; white-space: nowrap;">
            FAMILY PASS
          </div>
        `;

        return `
          <!-- --- CARD GROUP FOR ${item.name} --- -->
          <div class="card-group" style="page-break-inside: avoid; display: flex; flex-direction: column; gap: 15px; align-items: center; justify-content: center; margin-bottom: 25px;">
            
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
                    <div style="font-size: 24px; font-weight: 950; font-family: system-ui, -apple-system, sans-serif; text-transform: uppercase; border-bottom: 2px solid #000000; padding-bottom: 1px; color: #000000; line-height: 1.15; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px;">
                      ${item.name}
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; box-sizing: border-box; width: 100%;">
                    <div style="text-align: left;">
                      <span class="print-info-label">${phoneLabel}:</span>
                      <div class="print-info-val" style="font-family: monospace, SFMono-Regular, Consolas, sans-serif; font-size: 9.5px; font-weight: 850; color: #000000;">${item.phone}</div>
                    </div>
                    <div style="text-align: right;">
                      <span class="print-info-label">${cardIdLabel}:</span>
                      <div class="print-info-val" style="font-family: monospace, SFMono-Regular, Consolas, sans-serif; font-size: 9.5px; font-weight: 900; background: #ffffff; padding: 1.5px 4.5px; border-radius: 2px; color: #000000; border: 1.5px solid #000000; display: inline-block;">${item.id}</div>
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

            <!-- 2. BACK CARD SECTION IN LEFT-RIGHT SPLIT -->
            <div class="print-card-outer">
              <div class="print-card-container">
                <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; height: 100%; width: 100%; box-sizing: border-box; gap: 8px;">
                  
                  <!-- Left side of back: Maximize QR code occupying the entire left section with spacious padding -->
                  <div style="flex: 0 0 1.25in; display: flex; align-items: center; justify-content: center; height: 1.25in; width: 1.25in; border: 2px solid #000000; padding: 7px; border-radius: 5px; box-sizing: border-box; overflow: hidden; background: #ffffff;">
                    <div class="qr-target-print-back" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                      ${qrDataUrl ? `<img src="${qrDataUrl}" style="max-width: 100%; max-height: 100%; display: block; object-fit: contain;" />` : `<div style="font-size: 8px; color: #000; font-weight: bold;">Loading-QR</div>`}
                    </div>
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
                        ${item.name}
                      </div>
                      <div style="font-size: 7.5px; font-family: monospace, SFMono-Regular, Consolas, sans-serif; font-weight: 900; background: #ffffff; color: #000000 !important; display: inline-block; padding: 1.5px 4.5px; margin-top: 2.5px; border-radius: 2px; width: fit-content; border: 1.5px solid #000000;">
                        ID: ${item.id}
                      </div>
                    </div>

                    <div style="font-size: 5.5px; font-weight: 900; line-height: 1.25; padding-top: 3px; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; color: #000000;">
                      ${backFooter}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        `;
      }).join(`
        <!-- Decorative scissor lines cutting gap in printed media -->
        <div style="width: 100%; border-top: 1.5px dashed #cccccc; margin: 25px 0; page-break-inside: avoid;"></div>
      `);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en" class="notranslate">
          <head>
            <meta charset="UTF-8">
            <meta name="google" content="notranslate">
            <title>Print Passes - ${member.name}</title>
            <style>
              body { 
                margin: 0; 
                padding: 30px; 
                display: flex; 
                flex-direction: column;
                justify-content: flex-start; 
                align-items: center; 
                background-color: #ffffff;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                -webkit-font-smoothing: antialiased;
              }
              
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
                background-color: #ffffff;
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
                font-family: system-ui, -apple-system, sans-serif;
              }

              .print-info-val {
                font-size: 11px;
                font-weight: 900;
                color: #000000;
                line-height: 1.2;
              }

              @media print {
                body {
                  padding: 15px 0;
                  background-color: #ffffff;
                }
                @page {
                  size: auto;
                  margin: 0.3in;
                }
              }
            </style>
          </head>
          <body onload="setTimeout(function(){ window.print(); window.close(); }, 400);">
            ${cardsHTML}
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
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <div className="flex items-center justify-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveCardSide("front")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCardSide === "front" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
              >
                {t.btnShowFront}
              </button>
              <button
                onClick={() => setActiveCardSide("back")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeCardSide === "back" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"}`}
              >
                {t.btnShowBack}
              </button>
            </div>

            {/* QR Density simplification optimization state trigger */}
            <div className="bg-blue-50/50 border border-blue-150/40 rounded-2xl p-3 flex items-start gap-2.5 transition">
              <input
                type="checkbox"
                id="simplify-qr-toggle"
                checked={simplifyQr}
                onChange={(e) => setSimplifyQr(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 flex-shrink-0"
              />
              <label htmlFor="simplify-qr-toggle" className="cursor-pointer select-none text-left">
                <span className="text-[11px] font-black text-slate-800 block">
                  {t.qrDensityLabel}
                </span>
                <span className="text-[9.5px] text-slate-500 font-bold block leading-relaxed mt-0.5">
                  {t.qrDensitySub}
                </span>
              </label>
            </div>
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
                          level={simplifyQr ? "L" : "H"} 
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
            <div id="swim-member-card-hidden-back" className="overflow-hidden h-0 pointer-events-none" style={{ opacity: 1, visibility: "visible" }}>
              {/* Main Member Canvas */}
              <QRCodeCanvas 
                id="swim-qr-print-main"
                value={
                  simplifyQr
                    ? `${currentOrigin}?id=${encodeURIComponent(member.id)}&name=${encodeURIComponent(member.name)}&start=${encodeURIComponent(member.startDate)}&end=${encodeURIComponent(member.endDate)}`
                    : `${currentOrigin}?id=${encodeURIComponent(member.id)}&name=${encodeURIComponent(member.name)}&start=${encodeURIComponent(member.startDate)}&end=${encodeURIComponent(member.endDate)}&phone=${encodeURIComponent(member.phone || "None")}&plan=${encodeURIComponent(getNormalizedPlanName(member.plan, "en"))}`
                }
                size={220} 
                level={simplifyQr ? "L" : "H"} 
                includeMargin={false}
              />
              {/* Sub Members Canvases */}
              {member.subMembers?.map((sub) => {
                const subPhone = sub.phone || member.phone || "None";
                const subQrValue = simplifyQr
                  ? `${currentOrigin}?id=${encodeURIComponent(sub.id)}&name=${encodeURIComponent(sub.name)}&start=${encodeURIComponent(member.startDate)}&end=${encodeURIComponent(member.endDate)}`
                  : `${currentOrigin}?id=${encodeURIComponent(sub.id)}&name=${encodeURIComponent(sub.name)}&start=${encodeURIComponent(member.startDate)}&end=${encodeURIComponent(member.endDate)}&phone=${encodeURIComponent(subPhone)}&plan=${encodeURIComponent(getNormalizedPlanName(member.plan, "en"))}`;
                return (
                  <QRCodeCanvas 
                    key={sub.id}
                    id={`swim-qr-print-${sub.id}`}
                    value={subQrValue} 
                    size={220} 
                    level={simplifyQr ? "L" : "H"} 
                    includeMargin={false}
                  />
                );
              })}

              {/* --- DOWNLOAD ELEMENT EXTRACTION HOLDERS --- */}
              {[
                {
                  id: member.id,
                  name: member.name,
                  phone: member.phone || "None",
                  isPrincipal: true,
                },
                ...(member.subMembers || []).map(sub => ({
                  id: sub.id,
                  name: sub.name,
                  phone: sub.phone || member.phone || "None",
                  isPrincipal: false,
                }))
              ].map((holder) => {
                const holderQrValue = simplifyQr
                  ? `${currentOrigin}?id=${encodeURIComponent(holder.id)}&name=${encodeURIComponent(holder.name)}&start=${encodeURIComponent(member.startDate)}&end=${encodeURIComponent(member.endDate)}`
                  : `${currentOrigin}?id=${encodeURIComponent(holder.id)}&name=${encodeURIComponent(holder.name)}&start=${encodeURIComponent(member.startDate)}&end=${encodeURIComponent(member.endDate)}&phone=${encodeURIComponent(holder.phone)}&plan=${encodeURIComponent(getNormalizedPlanName(member.plan, "en"))}`;

                return (
                  <div key={`dl-pkg-${holder.id}`} id={`download-card-pkg-${holder.id}`} className="bg-white p-4">
                    
                    {/* Front Card element */}
                    <div 
                      id={`download-card-front-${holder.id}`}
                      className="w-[300px] h-[200px] bg-white text-black p-3.5 flex flex-col justify-between border-2 border-black rounded-xl select-none relative"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      <div className="flex justify-between items-start border-b-2 border-black pb-1.5" style={{ textDecoration: 'none' }}>
                        <div className="text-left" style={{ textDecoration: 'none' }}>
                          <h4 className="text-[12px] font-black tracking-wide leading-tight text-black" style={{ textDecoration: 'none' }}>
                            SEAHORSE FITNESS INC
                          </h4>
                          <p className="text-[7.5px] text-slate-700 font-bold leading-normal mt-0.5">
                            69 Columbia St, NY, NY 10002
                          </p>
                        </div>
                        {!holder.isPrincipal && (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-wider uppercase border border-black bg-white text-black">
                            FAMILY PASS
                          </span>
                        )}
                      </div>

                      <div className="my-auto py-1 flex flex-col justify-center text-left">
                        <span className="text-[9.5px] font-black tracking-wide text-black block uppercase">
                          GUEST NAME:
                        </span>
                        <h3 className="text-2xl font-black leading-none uppercase tracking-tight text-black border-b-2 border-black pb-0.5 my-1" style={{ textDecoration: 'none' }}>
                          {holder.name}
                        </h3>
                        
                        <div className="flex justify-between text-[9px] font-mono font-bold text-slate-800 mt-1">
                          <span>TELEPHONE: {holder.phone}</span>
                          <span className="bg-slate-100 px-1 rounded border border-slate-200">ID: {holder.id}</span>
                        </div>
                      </div>

                      <div className="border-t-2 border-black pt-1 flex justify-start items-end text-left">
                        <div className="font-mono leading-tight">
                          <span className="text-[7px] text-slate-500 block font-extrabold leading-none uppercase">
                            SWIM PASS VALIDITY PERIOD
                          </span>
                          <span className="text-[11px] font-black block tracking-tighter">
                            {member.startDate} ~ {member.endDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Back Card element */}
                    <div 
                      id={`download-card-back-${holder.id}`}
                      className="w-[300px] h-[200px] bg-white text-black p-3.5 flex flex-col justify-between border-2 border-black rounded-xl select-none"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      <div className="flex flex-row items-center justify-between h-full w-full gap-3">
                        <div className="flex-shrink-0 flex items-center justify-center p-1.5 border-2 border-black rounded-xl bg-white shadow-sm" style={{ width: "110px", height: "110px" }}>
                          <QRCodeSVG 
                            value={holderQrValue} 
                            size={94} 
                            level={simplifyQr ? "L" : "H"} 
                            includeMargin={false}
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between h-full text-left py-0.5">
                          <div>
                            <h4 className="text-[9.5px] font-black tracking-wide leading-tight text-black flex items-center gap-1">
                              SEAHORSE FITNESS
                            </h4>
                            <span className="text-[5.5px] text-slate-500 font-bold block leading-normal mt-0.5">
                              69 Columbia St, NY, NY 10002
                              <br />Cell: 347-272-2822
                            </span>
                          </div>

                          <div className="border-t border-dashed border-slate-300 pt-1 flex-grow flex flex-col justify-center text-left">
                            <span className="text-[6.5px] font-bold text-slate-700 block uppercase">
                              Card Holder
                            </span>
                            <span className="text-[12.5px] font-black uppercase text-black font-sans leading-tight">
                              {holder.name}
                            </span>
                            <span className="font-mono text-[7px] uppercase font-bold text-white bg-black px-1.5 py-0.5 rounded mt-1 block w-fit">
                              ID: {holder.id}
                            </span>
                          </div>

                          <div className="border-t border-black pt-1">
                            <span className="text-[5.5px] font-bold text-slate-700 leading-tight block font-mono">
                              SCAN QR CODE TO VERIFY PASS ELIGIBILITY
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coupled Front and Back for single JPG representation */}
                    <div 
                      id={`download-card-combined-${holder.id}`}
                      className="w-[340px] bg-white p-5 flex flex-col gap-4 items-center justify-center border border-slate-200 rounded-2xl"
                    >
                      {/* Embedded front card with exactly same style */}
                      <div 
                        className="w-[300px] h-[200px] bg-white text-black p-3.5 flex flex-col justify-between border-2 border-black rounded-xl select-none relative"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      >
                        <div className="flex justify-between items-start border-b-2 border-black pb-1.5">
                          <div className="text-left">
                            <h4 className="text-[12px] font-black tracking-wide leading-tight text-black">
                              SEAHORSE FITNESS INC
                            </h4>
                            <p className="text-[7.5px] text-slate-700 font-bold leading-normal mt-0.5">
                              69 Columbia St, NY, NY 10002
                            </p>
                          </div>
                          {!holder.isPrincipal && (
                            <span className="px-1.5 py-0.5 rounded text-[7px] font-extrabold tracking-wider uppercase border border-black bg-white text-black">
                              FAMILY PASS
                            </span>
                          )}
                        </div>

                        <div className="my-auto py-1 flex flex-col justify-center text-left">
                          <span className="text-[9.5px] font-black tracking-wide text-black block uppercase">
                            GUEST NAME:
                          </span>
                          <h3 className="text-2xl font-black leading-none uppercase tracking-tight text-black border-b-2 border-black pb-0.5 my-1">
                            {holder.name}
                          </h3>
                          
                          <div className="flex justify-between text-[9px] font-mono font-bold text-slate-800 mt-1 font-mono">
                            <span>TELEPHONE: {holder.phone}</span>
                            <span className="bg-slate-100 px-1 rounded border border-slate-200">ID: {holder.id}</span>
                          </div>
                        </div>

                        <div className="border-t-2 border-black pt-1 flex justify-start items-end text-left">
                          <div className="font-mono leading-tight">
                            <span className="text-[7px] text-slate-500 block font-extrabold leading-none uppercase">
                              SWIM PASS VALIDITY PERIOD
                            </span>
                            <span className="text-[11px] font-black block tracking-tighter">
                              {member.startDate} ~ {member.endDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Decorative folding tag border */}
                      <div className="w-full flex items-center justify-center gap-1.5 my-0.5 text-slate-400">
                        <div className="h-px bg-dashed border-t border-slate-300 flex-1"></div>
                        <span className="text-[8px] font-bold font-mono tracking-wider uppercase text-slate-400">FOLD OR CUT HERE</span>
                        <div className="h-px bg-dashed border-t border-slate-300 flex-1"></div>
                      </div>

                      {/* Embedded back card with exactly same style */}
                      <div 
                        className="w-[300px] h-[200px] bg-white text-black p-3.5 flex flex-col justify-between border-2 border-black rounded-xl select-none"
                        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      >
                        <div className="flex flex-row items-center justify-between h-full w-full gap-3">
                          <div className="flex-shrink-0 flex items-center justify-center p-1.5 border-2 border-black rounded-xl bg-white shadow-sm" style={{ width: "110px", height: "110px" }}>
                            <QRCodeSVG 
                              value={holderQrValue} 
                              size={94} 
                              level={simplifyQr ? "L" : "H"} 
                              includeMargin={false}
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between h-full text-left py-0.5 font-sans">
                            <div>
                              <h4 className="text-[9.5px] font-black tracking-wide leading-tight text-black flex items-center gap-1">
                                SEAHORSE FITNESS
                              </h4>
                              <span className="text-[5.5px] text-slate-500 font-bold block leading-normal mt-0.5">
                                69 Columbia St, NY, NY 10002
                                <br />Cell: 347-272-2822
                              </span>
                            </div>

                            <div className="border-t border-dashed border-slate-300 pt-1 flex-grow flex flex-col justify-center text-left">
                              <span className="text-[6.5px] font-bold text-slate-700 block uppercase">
                                Card Holder
                              </span>
                              <span className="text-[12.5px] font-black uppercase text-black font-sans leading-tight">
                                {holder.name}
                              </span>
                              <span className="font-mono text-[7px] uppercase font-bold text-white bg-black px-1.5 py-0.5 rounded mt-1 block w-fit">
                                ID: {holder.id}
                              </span>
                            </div>

                            <div className="border-t border-black pt-1">
                              <span className="text-[5.5px] font-bold text-slate-700 leading-tight block font-mono">
                                SCAN QR CODE TO VERIFY PASS ELIGIBILITY
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}

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

          {/* Card Download control suite */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4.5 w-4.5 text-blue-650" />
                <h4 className="font-extrabold text-slate-800 text-sm">
                  {t.downloadModalTitle}
                </h4>
              </div>
              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                Multi-pass Suite
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-bold leading-normal text-left">
              {t.downloadSelectMember}
            </p>

            <div className="flex flex-col gap-2 rounded-xl border border-slate-150 p-3 bg-white">
              <span className="text-[10.5px] font-bold text-slate-650 text-left block">
                {t.downloadChooseFormat}
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setDownloadFormat("JPG")}
                  className={`py-2 px-3 text-xs font-black rounded-lg border transition-all cursor-pointer text-center ${
                    downloadFormat === "JPG"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-705 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  JPG IMAGE
                </button>
                <button
                  type="button"
                  onClick={() => setDownloadFormat("PDF")}
                  className={`py-2 px-3 text-xs font-black rounded-lg border transition-all cursor-pointer text-center ${
                    downloadFormat === "PDF"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-slate-705 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  PDF DOCUMENT
                </button>
              </div>
              <p className="text-[9.5px] text-slate-400 font-bold mt-1 text-left">
                {downloadFormat === "JPG" ? t.downloadFormatJPG : t.downloadFormatPDF}
              </p>
            </div>

            {/* List of members to show what's being downloaded */}
            <div className="bg-slate-100/50 rounded-xl p-2.5 border border-slate-200 space-y-1.5 text-xs text-left font-semibold text-slate-600 max-h-32 overflow-y-auto">
              <div className="flex justify-between items-center bg-white border border-slate-150 p-1.5 px-2.5 rounded-lg shadow-2xs">
                <span>👤 {member.name} (主会员 • {member.id})</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 rounded font-black uppercase">Ready</span>
              </div>
              {member.subMembers?.map((sub) => (
                <div key={sub.id} className="flex justify-between items-center bg-white border border-slate-150 p-1.5 px-2.5 rounded-lg shadow-2xs">
                  <span>👥 {sub.name} (副会员 • {sub.id} • {sub.relationship})</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 rounded font-black uppercase">Ready</span>
                </div>
              ))}
            </div>

            {/* Download Button Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold transition shadow-sm text-xs cursor-pointer ${
                  isDownloading 
                    ? "bg-slate-200 text-slate-450 cursor-not-allowed border border-slate-350"
                    : "bg-emerald-600 hover:bg-emerald-750 text-white hover:shadow-md active:scale-[0.99] transition-all duration-150"
                }`}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                    <span>
                      {t.downloadingState} ({downloadProgress ? `${downloadProgress.current}/${downloadProgress.total}` : "..."})
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>{t.btnDownloadCards}</span>
                  </>
                )}
              </button>

              {/* Progress and Success Visualizations */}
              <AnimatePresence>
                {downloadSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-150 rounded-xl p-2.5 text-xs font-black justify-center"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 animate-bounce" />
                    <span>{t.downloadsCompleted}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
