/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Upload, 
  X,
  RefreshCw,
  QrCode
} from "lucide-react";
import { Member } from "../types";
import { TRANSLATIONS } from "../translations";
import { motion, AnimatePresence } from "motion/react";

interface MemberScannerProps {
  members: Member[];
  onClose: () => void;
  lang?: "en" | "zh";
}

export default function MemberScanner({ members, onClose, lang = "en" }: MemberScannerProps) {
  const t = TRANSLATIONS[lang];
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    status: "active" | "expired" | "not_found" | "invalid";
    memberId?: string;
    memberName?: string;
    startDate?: string;
    endDate?: string;
    daysRemaining?: number;
    rawText?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Play a synthesized sound to denote results without external media assets
  const playPing = (status: "active" | "expired" | "error") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (status === "active") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1, 0.1); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (status === "expired") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc.frequency.setValueAtTime(220.00, ctx.currentTime + 0.15, 0.1); // A3
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.41);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio Context error", e);
    }
  };

  // Start the camera
  const startCamera = async () => {
    setScanResult(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
      setIsScanning(true);
      setHasCamera(true);
    } catch (error) {
      console.error("Camera access error:", error);
      setHasCamera(false);
      setIsScanning(false);
    }
  };

  // Stop the camera
  const stopCamera = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Frame processing loop
  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) {
      requestRef.current = requestAnimationFrame(tick);
      return;
    }

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Equalize sizes
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Throttling scans for CPU optimization
        const now = Date.now();
        if (now - lastScanTimeRef.current > 500) {
          lastScanTimeRef.current = now;
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          
          if (code) {
            handleDecodedText(code.data);
            stopCamera();
            return; // Exit stream processing loop immediately
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  // Run camera loops when active
  useEffect(() => {
    if (isScanning) {
      requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isScanning]);

  // Decode the scanned string
  const handleDecodedText = (text: string) => {
    let parsedData: any = null;

    // 1. Try URL parameters first (like https://411vesc.github.io/swimpool-pass/?id=SWIM-1002&name=张三)
    if (text.includes("?") || text.includes("&")) {
      try {
        const queryParams = new URLSearchParams(text.substring(text.indexOf("?")));
        const parsedId = queryParams.get("id");
        const parsedName = queryParams.get("name");
        const parsedStart = queryParams.get("start");
        const parsedEnd = queryParams.get("end");

        if (parsedId || parsedName) {
          parsedData = {
            id: parsedId || "",
            name: parsedName || "",
            start: parsedStart || "",
            end: parsedEnd || ""
          };
        }
      } catch (e) {
        console.warn("URL parameters reading failed", e);
      }
    }

    // 2. Fallbacks for JSON format
    if (!parsedData && (text.startsWith("{") || text.includes("SWIMPOOL:"))) {
      try {
        if (text.includes("SWIMPOOL:")) {
          const jsonStr = text.split("SWIMPOOL:")[1]?.trim();
          if (jsonStr) {
            parsedData = JSON.parse(jsonStr);
          }
        } else {
          const jsonMatch = text.match(/\{"id".+\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.warn("JSON parsing failure in OCR fallback", e);
      }
    }

    // Prepare evaluation parameters
    let memberId = parsedData?.id || "";
    let name = parsedData?.name || "";
    let start = parsedData?.start || "";
    let end = parsedData?.end || "";

    // 3. Fallback regex search for custom text fields
    if (!parsedData) {
      const idMatch = text.match(/(?:会员号|No\.?|专属卡号)\s*:\s*([A-Za-z0-9_-]+)/i);
      const nameMatch = text.match(/(?:姓名|Name|会员姓名)\s*:\s*([^\n\r\t]+)/i);
      const startMatch = text.match(/(?:开始日期|开始|Start|有效期起)\s*:\s*([\d-]+)/i);
      const endMatch = text.match(/(?:结束日期|结束|End|有效期至)\s*:\s*([\d-]+)/i);

      if (idMatch) memberId = idMatch[1].trim();
      if (nameMatch) name = nameMatch[1].trim();
      if (startMatch) start = startMatch[1].trim();
      if (endMatch) end = endMatch[1].trim();
    }

    // Lookup matching database records
    let matchedMember = members.find(m => m.id.toLowerCase() === memberId.toLowerCase() && memberId !== "");
    let matchedSubMember: any = null;

    if (!matchedMember && memberId) {
      for (const m of members) {
        if (m.subMembers) {
          const foundSub = m.subMembers.find(s => s.id.toLowerCase() === memberId.toLowerCase());
          if (foundSub) {
            matchedMember = m;
            matchedSubMember = foundSub;
            break;
          }
        }
      }
    }

    if (!matchedMember && name) {
      matchedMember = members.find(m => m.name.trim() === name.trim());
      if (!matchedMember) {
        for (const m of members) {
          if (m.subMembers) {
            const foundSub = m.subMembers.find(s => s.name.trim() === name.trim());
            if (foundSub) {
              matchedMember = m;
              matchedSubMember = foundSub;
              break;
            }
          }
        }
      }
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const todayMs = new Date(todayStr).getTime();

    if (matchedMember) {
      const endMs = new Date(matchedMember.endDate).getTime();
      const diffDays = Math.ceil((endMs - todayMs) / (1000 * 3600 * 24));
      
      const isActive = diffDays >= 0;
      const status = isActive ? "active" : "expired";
      
      playPing(status);
      setScanResult({
        status,
        memberId: matchedSubMember ? matchedSubMember.id : matchedMember.id,
        memberName: matchedSubMember 
          ? `${matchedSubMember.name} (Relation: ${matchedSubMember.relationship})` 
          : matchedMember.name,
        startDate: matchedMember.startDate,
        endDate: matchedMember.endDate,
        daysRemaining: diffDays,
        rawText: `Primary GUEST: ${matchedMember.name}\nID: ${matchedMember.id}\nPhone: ${matchedMember.phone}\nPlan: ${matchedMember.plan}\nVerification source: Local DB Synchronized`
      });
    } else if (start && end) {
      // Local DB lookup misses. Offline fallback using QR dates directly!
      const endMs = new Date(end).getTime();
      const diffDays = Math.ceil((endMs - todayMs) / (1000 * 3600 * 24));
      
      const isActive = diffDays >= 0;
      const status = isActive ? "active" : "expired";
      
      playPing(status);
      setScanResult({
        status,
        memberId: memberId || "OFFLINE-ID",
        memberName: name || "Anonymous Swimmer",
        startDate: start,
        endDate: end,
        daysRemaining: diffDays,
        rawText: `Verification source: Offline Cryptic QR Code Validation\nID: ${memberId}\nNotice: Synced local database does not carry this specific record. Offline validity check was executed instead.`
      });
    } else {
      playPing("error");
      setScanResult({
        status: "invalid",
        rawText: text
      });
    }
  };

  // Decode uploaded image files
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanResult(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          tempCtx.drawImage(img, 0, 0);
          
          const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          
          if (code) {
            handleDecodedText(code.data);
          } else {
            playPing("error");
            setScanResult({
              status: "invalid",
              rawText: lang === "en" ? "Blank/No QR found" : "未能从上传图片中解码出任何有效一/二维码"
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow">
              <QrCode className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base">{t.lifeguardScanner}</h3>
              <p className="text-[10.5px] text-slate-500 font-bold">{lang === "en" ? "Independent Pool Entry Gate" : "非公开池边快速验证网关"}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center">
          
          <AnimatePresence mode="wait">
            {scanResult ? (
              /* Decoded scan results panels */
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full space-y-5 text-center py-4"
              >
                {/* 1. STATE PASS ACTIVE STATUS */}
                {scanResult.status === "active" && (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-md">
                      <CheckCircle2 className="h-10 w-10 animate-[bounce_1s_infinite]" />
                    </div>
                    <div>
                      <h4 className="text-emerald-800 font-black text-lg tracking-tight uppercase">
                        {lang === "en" ? "PASS GRANTED / VALID" : "审核通过 • 准予入水"}
                      </h4>
                      <p className="text-xs text-emerald-600 mt-1 font-bold">
                        {t.activeDaysLeft.replace("{days}", (scanResult.daysRemaining || 0).toString())}
                      </p>
                    </div>

                    <div className="border-t border-emerald-100 pt-4 grid grid-cols-2 gap-2 text-xs text-left text-slate-700">
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px] uppercase">Cardholder 姓名:</span>
                        <span className="font-black text-slate-800 text-sm">{scanResult.memberName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px] uppercase">Pass Card ID 通行号:</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{scanResult.memberId}</span>
                      </div>
                      <div className="col-span-2 border-t border-emerald-100/50 pt-2 flex justify-between font-mono font-bold text-[10px] text-slate-500">
                        <span>START 生效: {scanResult.startDate}</span>
                        <span>EXPIRY 截止: {scanResult.endDate}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. STATE EXPIRED STATUS */}
                {scanResult.status === "expired" && (
                  <div className="p-6 bg-rose-50 border border-rose-250 rounded-2xl space-y-4">
                    <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg">
                      <XCircle className="h-10 w-10 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-rose-800 font-extrabold text-lg tracking-tight uppercase">
                        {lang === "en" ? "EXPIRED / ACCESS BARRED" : "到期不通过 • 拒绝入水"}
                      </h4>
                      <p className="text-xs text-rose-600 mt-1 font-black">
                        {t.expiredDaysAgo.replace("{days}", Math.abs(scanResult.daysRemaining || 0).toString())}
                      </p>
                    </div>

                    <div className="border-t border-rose-100 pt-4 grid grid-cols-2 gap-2 text-xs text-left text-slate-700">
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px] uppercase">Customer 姓名:</span>
                        <span className="font-semibold text-slate-800 truncate block">{scanResult.memberName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-bold text-[10px] uppercase">Card ID:</span>
                        <span className="font-mono font-bold text-slate-800">{scanResult.memberId}</span>
                      </div>
                      <div className="col-span-2 border-t border-rose-100/50 pt-2 flex justify-between font-mono font-bold text-[10px] text-slate-500">
                        <span>START: {scanResult.startDate}</span>
                        <span>EXPIRY: {scanResult.endDate}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. INVALID OR CRASHED DATA STATUS */}
                {scanResult.status === "invalid" && (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center text-white mx-auto">
                      <AlertCircle className="h-8 w-8 animate-pulse" />
                    </div>
                    <div>
                      <h5 className="text-slate-800 font-black text-base">{lang === "en" ? "INVALID CODE OR UNIDENTIFIABLE QR" : "格式不匹配 • 核验未完成"}</h5>
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{lang === "en" ? "This barcode is not compliant with Seahorse Fitness VIP structure." : "该二维码不是本设施可验证的会员资格卡，或者数据格式已损坏。"}</p>
                    </div>

                    <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl text-left text-xs text-slate-600 overflow-x-auto select-all max-h-24">
                      <p className="text-slate-500 font-bold mb-1">{lang === "en" ? "Decoded contents:" : "原码解密内容："}</p>
                      <pre className="font-mono text-[10.5px] whitespace-pre-wrap">{scanResult.rawText}</pre>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-center w-full">
                  <button
                    onClick={startCamera}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <RefreshCw className="h-4 w-4" /> 
                    <span>{lang === "en" ? "Scan Again" : "再次扫描"}</span>
                  </button>
                  <button
                    onClick={() => setScanResult(null)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-xl text-sm font-medium transition cursor-pointer"
                  >
                    {lang === "en" ? "Clear Result" : "清除结果"}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* VIEW FINDER COMPONENT DRAWING BLOCK */
              <div className="w-full flex flex-col items-center space-y-6">
                
                {/* Visual Camera Viewfinder Area */}
                <div className="relative w-full aspect-square max-w-[320px] bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-200 flex flex-col items-center justify-center shadow-lg">
                  
                  {isScanning ? (
                    <>
                      {/* Live Video */}
                      <video 
                        ref={videoRef} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      
                      {/* Viewfinder corner brackets */}
                      <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-md"></div>
                      <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-md"></div>
                      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-md"></div>
                      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-md"></div>
                      
                      {/* Sliding green scan laser */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_12px_#3b82f6] animate-[scan_2s_linear_infinite]"></div>
                      
                      {/* Scanning Text overlay */}
                      <span className="absolute bottom-4 px-3 py-1 bg-slate-900/90 rounded-full text-[10px] font-mono text-blue-400 tracking-wider">
                        CAMERA ACTIVE • SCANNING...
                      </span>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-150">
                        <CameraOff className="h-6 w-6" />
                      </div>
                      <div className="text-slate-700 font-bold text-sm">
                        {hasCamera ? (lang === "en" ? "Camera Inactive" : "摄影探头暂未开启") : (lang === "en" ? "Camera permissions blocked" : "未检测到可用的摄像头权限")}
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-[220px]">
                        {lang === "en" ? "Activate device camera or simply drop/upload card screenshots on the right to complete verification check." : "点击下方按钮开启前/后置摄像头，或直接在右侧上传会员卡图片进行扫描核验。"}
                      </p>
                    </div>
                  )}
                  
                  {/* Invisible working canvas */}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Control Buttons */}
                <div className="w-full space-y-3 flex flex-col items-stretch">
                  {isScanning ? (
                    <button
                      onClick={stopCamera}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow"
                    >
                      <CameraOff className="h-4 w-4" /> 
                      <span>{lang === "en" ? "Disable Camera View" : "关闭摄像头"}</span>
                    </button>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm cursor-pointer shadow hover:shadow-md transition active:scale-[0.99]"
                    >
                      <Camera className="h-4 w-4" /> 
                      <span>{lang === "en" ? "Begin Camera Scan" : "开启主图摄像机扫码"}</span>
                    </button>
                  )}

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold">{lang === "en" ? "Or Drop/Upload Verification Pictures" : "或者使用图片档案直接校验"}</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Upload QR File Input */}
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold cursor-pointer transition-all">
                    <Upload className="h-4 w-4 text-slate-500" />
                    <span>{lang === "en" ? "Upload Member QR Screenshot" : "上传会员卡截图/图片"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                  
                  <div className="bg-slate-50 p-4 rounded-xl text-[11px] text-slate-500 leading-relaxed border border-slate-200 font-medium">
                    <p className="font-bold text-slate-705 mb-1">{lang === "en" ? "Setup guidelines:" : "柜台使用指南："}</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>{lang === "en" ? "Hold card on desk or screen facing camera lens." : "池边安全员或救生员直接点击主按钮开启摄像机扫码。"}</li>
                      <li>{lang === "en" ? "The system detects green border markers and triggers sound alert." : "对准会员出示的专属黑白实体通行卡，或者手机界面二维码。"}</li>
                      <li>{lang === "en" ? "Success triggers high alert tone, checking dates instantly." : "识别通过会响起轻柔水花反馈嘀声，绿屏通过，红屏到期警诫。"}</li>
                      <li>{lang === "en" ? "Works even entirely offline by self-parsing card values!" : "如果户外泳池网络较差，系统可全自动执行<b>离线保底解码校验</b>。"}</li>
                    </ol>
                  </div>
                </div>

              </div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
      
      {/* Styles for scanning laser lines */}
      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
