/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Member, PLAN_PRESETS, SubMember } from "../types";
import { TRANSLATIONS } from "../translations";
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  Calendar, 
  User, 
  Phone, 
  DollarSign, 
  Hash, 
  Clock, 
  Info,
  Users,
  Trash2,
  Plus
} from "lucide-react";
import { motion } from "motion/react";

interface MemberFormProps {
  member?: Member | null; // If passed, editing mode
  existingIds: string[];
  onSave: (member: Member) => void;
  onClose: () => void;
  lang?: "en" | "zh"; // Optional global language state
}

export default function MemberForm({ member, existingIds, onSave, onClose, lang = "en" }: MemberFormProps) {
  const isEditMode = !!member;
  const t = TRANSLATIONS[lang];

  // Form states matching user request fields
  const [id, setId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [price, setPrice] = useState<number>(600);
  const [plan, setPlan] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [extraInfo, setExtraInfo] = useState<string>("");
  const [lastPaymentDate, setLastPaymentDate] = useState<string>("");
  const [alertSent, setAlertSent] = useState<boolean>(false);

  // New state: family plan sub-members list
  const [subMembers, setSubMembers] = useState<SubMember[]>([]);
  
  // Local inline inputs for adding a family sub-member
  const [subName, setSubName] = useState<string>("");
  const [subRelation, setSubRelation] = useState<string>("Spouse");
  const [subPhone, setSubPhone] = useState<string>("");

  const [idError, setIdError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Initialize fields
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    if (member) {
      // Editing
      setId(member.id);
      setName(member.name);
      setPhone(member.phone);
      setPrice(member.price);
      setPlan(member.plan);
      setStartDate(member.startDate);
      setEndDate(member.endDate);
      setExtraInfo(member.extraInfo);
      setLastPaymentDate(member.lastPaymentDate);
      setAlertSent(member.alertSent);
      setSubMembers(member.subMembers || []);
    } else {
      // Creating new
      setStartDate(todayStr);
      setLastPaymentDate(todayStr);
      
      // Compute sequential ID
      let nextIdNum = 1001;
      const swimIds = existingIds
        .filter(id => id.startsWith("SWIM-"))
        .map(id => parseInt(id.replace("SWIM-", ""), 10))
        .filter(num => !isNaN(num));

      if (swimIds.length > 0) {
        nextIdNum = Math.max(...swimIds) + 1;
      }
      const initialId = `SWIM-${nextIdNum}`;
      setId(initialId);
      
      // Default to Month Pass preset translated
      const monthlyPreset = PLAN_PRESETS.find(p => p.nameKey === "presetMonth");
      const defaultPlanText = monthlyPreset ? (t[monthlyPreset.nameKey] || "Monthly Pass") : "Monthly Pass";
      setPlan(defaultPlanText);

      if (monthlyPreset) {
        setPrice(monthlyPreset.defaultPrice);
        setEndDate(calculateEndDate(todayStr, monthlyPreset.durationDays));
      } else {
        setEndDate(calculateEndDate(todayStr, 30));
      }
    }
  }, [member, lang]); // React to member or language changes to keep dropdown syncing appropriately

  // Generate unique sequential ID manual action
  const generateUniqueID = () => {
    let nextIdNum = 1001;
    const swimIds = existingIds
      .filter(id => id.startsWith("SWIM-"))
      .map(id => parseInt(id.replace("SWIM-", ""), 10))
      .filter(num => !isNaN(num));

    if (swimIds.length > 0) {
      nextIdNum = Math.max(...swimIds) + 1;
    }
    
    setId(`SWIM-${nextIdNum}`);
    setIdError("");
  };

  // Helper to add days to a date string YYYY-MM-DD
  const calculateEndDate = (start: string, days: number): string => {
    if (!start) return "";
    try {
      const d = new Date(start);
      d.setDate(d.getDate() + days);
      return d.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  // Handle plan drop-down change
  const handlePlanChange = (selectedPlanName: string) => {
    setPlan(selectedPlanName);
    
    // Reverse look up in PLAN_PRESETS by comparing localized values in selected language
    const preset = PLAN_PRESETS.find(p => {
      const localizedName = t[p.nameKey];
      return localizedName === selectedPlanName;
    });

    if (preset) {
      setPrice(preset.defaultPrice);
      if (startDate) {
        const estimatedEnd = calculateEndDate(startDate, preset.durationDays);
        setEndDate(estimatedEnd);
      }
    }
  };

  // Recalculate end date whenever start date changes
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setLastPaymentDate(newStart);
    
    // Find preset corresponding to currently selected plan
    const preset = PLAN_PRESETS.find(p => t[p.nameKey] === plan);
    if (preset) {
      const estimatedEnd = calculateEndDate(newStart, preset.durationDays);
      setEndDate(estimatedEnd);
    }
  };

  // Check ID validity
  const handleIdChange = (val: string) => {
    const formatted = val.trim().toUpperCase();
    setId(formatted);
    
    if (!formatted) {
      setIdError(lang === "en" ? "Member ID cannot be empty" : "会员专属号码不能为空");
    } else if (!isEditMode && existingIds.includes(formatted)) {
      setIdError(lang === "en" ? "This ID number has already been registered!" : "该会员专属号码已在系统中登记！");
    } else {
      setIdError("");
    }
  };

  // Add sub member family item locally
  const handleAddSubMember = () => {
    if (!subName.trim()) {
      alert(lang === "en" ? "Sub-member name cannot be empty" : "请输入家庭副卡姓名");
      return;
    }

    // Temporary unique ID suffix derived by length letter indices
    const letterCode = String.fromCharCode(65 + subMembers.length);
    const newSub: SubMember = {
      id: `${id.trim().toUpperCase() || "SWIM-TEMP"}-${letterCode}`,
      name: subName.trim(),
      relationship: subRelation,
      phone: subPhone.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setSubMembers([...subMembers, newSub]);
    
    // Reset local sub-form inputs
    setSubName("");
    setSubPhone("");
  };

  // Remove a sub member family item locally
  const handleRemoveSubMember = (indexToRemove: number) => {
    const filtered = subMembers.filter((_, idx) => idx !== indexToRemove);
    // Relabel IDs alphabetically A, B, C... to make sequential identifiers highly tidy
    const remapped = filtered.map((sub, idx) => ({
      ...sub,
      id: `${id.trim().toUpperCase()}-${String.fromCharCode(65 + idx)}`
    }));
    setSubMembers(remapped);
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!id.trim()) {
      errors.id = lang === "en" ? "Please assign card ID number" : "请指定会员专属号码";
    }
    if (!name.trim()) {
      errors.name = lang === "en" ? "Swimmer name is required" : "请输入会员姓名";
    }
    if (!phone.trim()) {
      errors.phone = lang === "en" ? "Customer phone is required" : "请输入联系电话";
    }
    if (price < 0) {
      errors.price = lang === "en" ? "Price cannot be less than zero" : "价格不能小于0";
    }
    if (!startDate) {
      errors.startDate = lang === "en" ? "Effective date is required" : "请选择开始日期";
    }
    if (!endDate) {
      errors.endDate = lang === "en" ? "Expiration date is required" : "请选择到期日期";
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.endDate = lang === "en" ? "Expiration date must be after effective date" : "结束日期必须晚于开始日期";
    }

    if (!isEditMode && existingIds.includes(id.trim().toUpperCase())) {
      errors.id = lang === "en" ? "This ID number already exists" : "该专属会员号码已存在";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Recompute clean child IDs sequencing before triggering save, matching parent ID automatically
    const cleanedSubMembers = subMembers.map((sub, index) => ({
      ...sub,
      id: `${id.trim().toUpperCase()}-${String.fromCharCode(65 + index)}`
    }));

    onSave({
      id: id.trim().toUpperCase(),
      name: name.trim(),
      phone: phone.trim(),
      price,
      plan: plan || (lang === "en" ? "Custom Duration" : "自定义卡种计划"),
      startDate,
      endDate,
      extraInfo: extraInfo.trim(),
      lastPaymentDate: lastPaymentDate,
      alertSent,
      createdAt: member?.createdAt || new Date().toISOString(),
      subMembers: cleanedSubMembers.length > 0 ? cleanedSubMembers : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">
              {isEditMode ? t.editSwimmerTitle.replace("{name}", member?.name || "") : t.newSwimmerTitle}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t.newSwimmerFormSub}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-700">
          
          {/* Section 1: Membership Identity */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-blue-600" /> {t.formSectionIdentity}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Member ID */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>{t.formSectionIdentityLabel} <span className="text-rose-450">*</span></span>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={generateUniqueID}
                      className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded-lg transition font-bold cursor-pointer hover:border-blue-300"
                    >
                      <Sparkles className="h-3 w-3" /> {lang === "en" ? "Auto" : "自动生成"}
                    </button>
                  )}
                </label>
                <input 
                  type="text" 
                  value={id}
                  disabled={isEditMode}
                  onChange={(e) => handleIdChange(e.target.value)}
                  placeholder="e.g. SWIM-1002"
                  className={`w-full bg-white border px-3 py-2 rounded-xl text-slate-800 placeholder-slate-400 font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    idError || formErrors.id ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
                  } ${isEditMode ? "opacity-60 cursor-not-allowed bg-slate-100 font-bold" : ""}`}
                />
                {(idError || formErrors.id) && (
                  <p className="text-xs text-rose-500 mt-1">{idError || formErrors.id}</p>
                )}
              </div>

              {/* Plans Presets Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t.formPlanLabel}
                </label>
                <select
                  value={plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer font-bold"
                >
                  {/* Localized choices mapping PLAN_PRESETS */}
                  {PLAN_PRESETS.map((p) => {
                    const planLabel = t[p.nameKey] || p.nameKey;
                    return (
                      <option key={p.nameKey} value={planLabel} className="bg-white text-slate-800">
                        {planLabel} ({p.durationDays}d • ¥{p.defaultPrice})
                      </option>
                    );
                  })}
                  <option value={t.customPlanLabel}>{t.customPlanLabel}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Core Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4 text-blue-600" /> {t.formSectionDetails}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t.formName} <span className="text-rose-450">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                    }}
                    placeholder={lang === "en" ? "Enter member's legal name" : "请输入会员姓名"}
                    className={`w-full bg-white border px-3 py-2 pl-9 rounded-xl text-slate-800 placeholder-slate-450 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      formErrors.name ? "border-rose-300 bg-rose-50/10" : "border-slate-200"
                    }`}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t.formPhone} <span className="text-rose-450">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                    }}
                    placeholder="e.g. 138-0000-0000 / 347-xxx-xxxx"
                    className={`w-full bg-white border px-3 py-2 pl-9 rounded-xl text-slate-800 placeholder-slate-450 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                      formErrors.phone ? "border-rose-300 bg-rose-50/10" : "border-slate-200"
                    }`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.phone}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                  <span>{t.formPrice}</span>
                  <span className="text-slate-450 text-[10px] font-bold">({lang === "en" ? "Editable" : "柜台实支"})</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    placeholder="600"
                    className="w-full bg-white border border-slate-200 px-3 py-2 pl-9 rounded-xl text-slate-800 placeholder-slate-450 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Last Payment Date */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t.formDatePaid}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <input 
                    type="date" 
                    value={lastPaymentDate}
                    onChange={(e) => setLastPaymentDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 pl-9 rounded-xl text-slate-800 text-xs md:text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INLINE SUB-MEMBERS MODULE Integration */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
            <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-600" /> {t.familyOptionHeader}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">{t.familyOptionSub}</p>

            {/* List Existing Submembers */}
            {subMembers.length > 0 && (
              <div className="space-y-2 border-b border-dashed border-slate-200 pb-4">
                {subMembers.map((sub, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{sub.name}</p>
                      <div className="flex gap-4 text-[10px] text-slate-500 font-bold mt-0.5 font-mono">
                        <span>关系 Rel: {
                          sub.relationship === "Spouse" ? t.familyRelationSpouse :
                          sub.relationship === "Child" ? t.familyRelationChild :
                          sub.relationship === "Parent" ? t.familyRelationParent : t.familyRelationOther
                        }</span>
                        {sub.phone && <span>Phone: {sub.phone}</span>}
                        <span className="text-indigo-650 bg-indigo-50 px-1 rounded">卡号 ID: {sub.id}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubMember(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition hover:text-rose-700 border border-transparent hover:border-rose-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline add controls */}
            <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Inline Sub Member Name */}
                <div>
                  <label className="text-[10px] font-bold text-indigo-900 block mb-1">
                    {t.familyMemberName}
                  </label>
                  <input
                    type="text"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder={lang === "en" ? "Companion name" : "如：李小华"}
                    className="w-full bg-white border border-indigo-150 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>

                {/* Inline Relationship dropdown */}
                <div>
                  <label className="text-[10px] font-bold text-indigo-900 block mb-1">
                    {t.familyMemberRel}
                  </label>
                  <select
                    value={subRelation}
                    onChange={(e) => setSubRelation(e.target.value)}
                    className="w-full bg-white border border-indigo-150 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 cursor-pointer font-bold"
                  >
                    <option value="Spouse">{lang === "en" ? "Spouse" : "配偶 (Spouse)"}</option>
                    <option value="Child">{lang === "en" ? "Child" : "子女 (Child)"}</option>
                    <option value="Parent">{lang === "en" ? "Parent" : "父母 (Parent)"}</option>
                    <option value="Other">{lang === "en" ? "Other" : "其他 (Other)"}</option>
                  </select>
                </div>

                {/* Inline phone number optional */}
                <div>
                  <label className="text-[10px] font-bold text-indigo-900 block mb-1">
                    {t.familyMemberPhone}
                  </label>
                  <input
                    type="tel"
                    value={subPhone}
                    onChange={(e) => setSubPhone(e.target.value)}
                    placeholder="917-xxx-xxxx"
                    className="w-full bg-white border border-indigo-150 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSubMember}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t.btnAddFamilyMember}</span>
              </button>
            </div>
          </div>

          {/* Section 3: Validity Dates */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" /> {t.formSectionDates}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {t.formStartDate} <span className="text-rose-450">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2 pl-9 rounded-xl text-slate-800 text-xs md:text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-bold text-slate-705 block mb-1.5 flex items-center gap-1 select-none">
                  <span>{t.formEndDate}</span>
                  <span className="text-emerald-700 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full flex items-center font-black border border-emerald-150">
                    {t.formAutoEstimated}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: "" });
                    }}
                    className={`w-full bg-white border px-3 py-2 pl-9 rounded-xl text-slate-800 text-xs md:text-sm focus:ring-2 focus:ring-blue-500/20 ${
                      formErrors.endDate ? "border-rose-300 bg-rose-50/10" : "border-slate-200"
                    }`}
                  />
                </div>
                {formErrors.endDate && (
                  <p className="text-xs text-rose-500 mt-1">{formErrors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Extra Metadata */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4 w-4 text-slate-500" /> {t.formRemarksHeader}
            </h4>

            {/* Extra Info */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                {t.formRemarksLabel}
              </label>
              <textarea 
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder={t.formRemarksPlaceholder}
                rows={2}
                className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-xs leading-relaxed font-semibold"
              />
            </div>

            {/* Alert Sent Checkbox */}
            <label className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition select-none">
              <input 
                type="checkbox" 
                checked={alertSent}
                onChange={(e) => setAlertSent(e.target.checked)}
                className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">{t.formCheckboxAlert}</span>
                <span className="text-[10px] text-slate-500 block leading-normal mt-0.5">{t.formCheckboxAlertSub}</span>
              </div>
            </label>
          </div>

          {/* Action Row */}
          <div className="flex gap-4 border-t border-slate-150 pt-5">
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
            >
              {t.buttonFormSave}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-605 font-bold rounded-xl transition cursor-pointer text-sm"
            >
              {t.buttonFormCancel}
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
