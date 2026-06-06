/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const TRANSLATIONS = {
  en: {
    // Brand Headers
    systemTitle: "SEAHORSE FITNESS INC",
    systemSub: "Member Pass Management & Lifeguard Verification Terminal",
    systemBrandFull: "SEAHORSE FITNESS INC | MEMBER SYSTEM",
    swimmingPool: "Seahorse Swimming Center",
    chineseName: "Seahorse Fitness Inc (海马游泳中心)",
    counterTerminal: "Front Desk & Lifeguard Terminal",
    todayBase: "Current Reference Date",
    
    // Auth & Navigation
    lifeguardScanner: "Lifeguard Scanner Gate (No Login)",
    registerMember: "Register Member",
    logout: "Log Out & Lock Screen",
    loginTitle: "Seahorse Fitness",
    loginSubTitle: "Member Administration & Verification Hub",
    loginHint: "Demo Account:",
    loginPasswordHint: "Demo Password:",
    adminAccount: "Admin Account",
    loginPassword: "Login Password",
    enterUsername: "Enter username",
    enterPassword: "Enter password",
    unlockSystem: "Unlock Admin Panel",
    noLoginChannelHeading: "NO LOGIN GATEWAY",
    lifeguardNoLoginBtn: "Lifeguard Scanner (No Password)",
    lifeguardNoLoginHint: "Lifeguards can directly trigger camera scans or upload image checks here without exposing administrative list views.",
    accountErr: "Incorrect admin username or password! Default account: Seahorse / Seahorse691121",

    // Dashboard Statistics
    totalMembers: "Total Swim Members",
    activeCount: "Normal / Active (>=0 days)",
    expiredCount: "Expired Members (<0 days)",
    warningCount: "7-Day Expiring Reminders",
    clickToRead: "Click to View Reminders",

    // Filters and Search
    eligibilityBoard: "Member Passage Eligibility Directory",
    retrievedCount: "Matched {count} swimmer records",
    searchSubhint: "Interactive lookup by Name, 11-digit phone, or SWIM ID",
    exportExcel: "Export Spreadsheet",
    backupDB: "Backup Database",
    restoreDB: "Import & Restore",
    searchPlaceholder: "Search by Swimmer Name, Phone, SWIM ID...",
    allCapsText: "All Records",
    activeText: "Active Members",
    expiringText: "7 days expiring",
    expiredText: "Expired",
    filterRemindersAll: "All Alerts",
    filterRemindersAlerted: "Alert Sent",
    filterRemindersNotAlerted: "Unsent",

    // Table Columns
    colCardNo: "Card Number",
    colBasicInfo: "Identity Details",
    colPlanPrice: "Plan & Payment",
    colValidityRange: "Validity Period",
    colRemainingDays: "Remaining Days",
    colAlertReminder: "Notification Status",
    colAction: "Operations",

    // Table Data Items
    expiredDaysAgo: "Expired {days} days ago",
    expiringDaysLeft: "Expiring soon ({days}d)",
    activeDaysLeft: "Active ({days} days left)",
    sentAlert: "Notified",
    unsentAlert: "Unnotified",
    clickToToggleAlert: "Click to toggle reminder sent state",

    // Operations Tooltips
    viewPass: "View & print physical verification card",
    editInfo: "Edit payments, plans or dates",
    deletePass: "Delete membership file permanently",
    noRecords: "No matching swimmers found in the database.",
    resetSearch: "Reset Query",
    searchNoMatchDes: "No records found matching \"{query}\". Reset to list all items or create a new swimmer card.",

    // Notices
    operationalNoticeTitle: "Operational Counter Workflow Guide:",
    operationalNoticeBody: "When registering members, select plan durations (Week, Month, Year). The system dynamically estimates the end date. Share or print the Member Card (dashed boundary fits standard 3'' x 2'' cards) onto sticker paper for cards/goggles or bags. Life guards use their phones to scan the QR: Green means access granted; Red indicates expired alerts.",
    viewSkillsBtn: "Operational Tip Guide",
    skillsAlertMsg: "Operational Guide: Download the Database Backup JSON files regularly. To test scanner validation, you can directly run webcam capture on thermal printed paper card or upload screenshots here!",

    // Quick Alert Dialog
    remindersTitle: "Impressing Expiring Alerts Station",
    remindersSubtitle: "Members whose facility access runs out in 7 days or less",
    remindersBanner: "There are {count} swimmers about to lose water passage inside 7 days. Please follow up with payment renewals.",
    remindersPhone: "Phone",
    remindersPlan: "Tier",
    remindersAutomaticDeactivation: "Access automatically terminates at midnight on expiration day",
    remindersNoExpiring: "Waterway Safe! No Impending Expanses",
    remindersNoExpiringBody: "Currently all active members have valid passages safely beyond the 7-day alert window.",
    closeStation: "Close Alerts Center",
    copyTemplateBtn: "Copy Standard SMS Talk",
    smsCopyAlert: "Standard Renewal Text generated and copied to your clipboard!\n\nTemplate has been prefilled with member details.",

    // MemberForm Dialog
    newSwimmerTitle: "Register Swimmer Profile",
    editSwimmerTitle: "Modify Membership Profile - {name}",
    newSwimmerFormSub: "Provide registration specs; dates and local identifiers estimate dynamically.",
    formSectionIdentity: "1. Swimmer Identifier & Plan Tier",
    formSectionIdentityLabel: "Assign Distinct Number",
    formPlanLabel: "Choose Membership plan duration",
    formSectionDetails: "2. Swimmer Identity & Money Transacted",
    formName: "Full Member Name",
    formPhone: "Contact Telephone",
    formPrice: "Real Money Paid Amount (RMB)",
    formDatePaid: "Transaction Payment Date",
    formSectionDates: "3. Passage Validity Range",
    formStartDate: "Effective Date (START)",
    formEndDate: "Expiration Date (END)",
    formAutoEstimated: "Auto Estimated",
    formRemarksHeader: "4. Internal Extras & Alert Sent",
    formRemarksLabel: "Extra Remarks / Notes (e.g. medical limits, lockers, swim master)",
    formRemarksPlaceholder: "Input optional notes...",
    formCheckboxAlert: "Mark Expiration Notification as SENT",
    formCheckboxAlertSub: "Indicates that staff has contacted this customer directly about renewal options.",
    buttonFormSave: "Save Swimming Pass",
    buttonFormCancel: "Cancel",

    // Member Pass Card Dialog
    cardVoucherTitle: "Swimmer Pass Pass",
    cardVoucherSub: "High contrast B&W design for excellent standard thermal resolution",
    cardToggleLang: "Language",
    cardDaysRemaining: "Effective Remaining Days",
    cardPaid: "Amount Paid",
    cardPaymentDate: "Transaction Date",
    cardAlertState: "Expiration Alert Status",
    cardEditState: "Edit State",
    cardPublicLink: "Public Verification Link (GitHub Pages Direct Scanner Url)",
    cardCopyLink: "Copy Pass Link",
    cardNotesRemarks: "Notes / Warnings",
    btnPrintDouble: "Print Double-Sided Card (3'' x 2'')",
    btnCloseCard: "Close Pass",
    cardSmsCopied: "Unique verification link copied to clipboard! Share this link to test scanning.",

    // Card specifics
    frontSideTitle: "Front Side (Text Card Layout)",
    backSideTitle: "Back Side (Large Scan Area Layout)",
    frontSideHead: "MEMBER VIP PASS",
    backVerifyLabel: "MEMBER VERIFICATION • SCAN PASS",
    scanVerText: "SCAN QR TO VERIFY PASS VALIDITY",
    qrDensityLabel: "Simplified QR Code (Optimize Visual Density)",
    qrDensitySub: "Omit auxiliary fields and reduce error-correction level for cleaner, larger-blocked, faster-scanning layout.",

    // Dialog Toggle
    btnShowFront: "Show Front Side",
    btnShowBack: "Show Back Side",

    // Family System Spec
    familyOptionHeader: "Family Plan Members (Sub-Cards)",
    familyOptionSub: "Family subscriptions support printing distinctive cards for family sub-members using the same plan duration.",
    btnAddFamilyMember: "Add Family Member Info",
    familyMemberName: "Sub-Member Name",
    familyMemberRel: "Relationship",
    familyMemberPhone: "Phone (Optional)",
    familyRelationSpouse: "Spouse",
    familyRelationChild: "Child",
    familyRelationParent: "Parent",
    familyRelationOther: "Other",
    familyRemoveBtn: "Remove",
    holderSelectorLabel: "Choose Card Holder to Show/Print:",
    holderPrincipalName: "Principal Holder (主卡 • {id})",
    holderSubName: "Family Holder (副卡 • {id} • {relationship})",
    primaryParentLabel: "Primary Account Holder",
    subMemberDetails: "Family Sub-card of {name}",
    
    // Membership plan presets
    presetOnce: "Single Entry (Temporary Session)",
    presetWeek: "Weekly Pass (Swim Tryout)",
    presetMonth: "Month Pass",
    presetSeason: "Quarterly Pass (Seasonal Swim)",
    presetHalfYear: "6-Month Pass",
    presetYear: "Year Pass",
    presetFamilyYear: "Family Annual Pass (Multi-user Shared Plan)",
    customPlanLabel: "Custom Plan Category"
  },
  zh: {
    // Brand Headers
    systemTitle: "海马游泳中心",
    systemSub: "会员专属通行资格与安全员快速核验台",
    systemBrandFull: "海马游泳中心 | 会员管理系统",
    swimmingPool: "海马游泳中心 (Seahorse Swimming Center)",
    chineseName: "海马游泳中心 (Seahorse Fitness Inc)",
    counterTerminal: "前台管理与安全核验一体端",
    todayBase: "当前基准日期",

    // Auth & Navigation
    lifeguardScanner: "救生员扫码核验通道 (免登录)",
    registerMember: "登记游泳会员",
    logout: "安全解锁退出",
    loginTitle: "海马游泳中心",
    loginSubTitle: "前台会员管理与扫码校验控制台",
    loginHint: "体验账号：",
    loginPasswordHint: "体验密码：",
    adminAccount: "管理员账号",
    loginPassword: "登录密码",
    enterUsername: "请输入用户名",
    enterPassword: "请输入密码",
    unlockSystem: "开启系统管理面板",
    noLoginChannelHeading: "无需登录专用通道",
    lifeguardNoLoginBtn: "救生员扫码核验通道 (免登录)",
    lifeguardNoLoginHint: "救生员可以直接在此点击调用摄像头或上传截图校验卡片日期，无需输入密码安全进入后台，防止隐私数据外泄。",
    accountErr: "账号或密码不正确！默认测试账号: Seahorse 密码: Seahorse691121",

    // Dashboard Statistics
    totalMembers: "在库会员总数",
    activeCount: "正常在状态 (>=0天)",
    expiredCount: "已过期会员 (<0天)",
    warningCount: "7天内到期提醒信息",
    clickToRead: "点击查阅 Reminders &raquo;",

    // Filters and Search
    eligibilityBoard: "会员通行资格档案台",
    retrievedCount: "已检索出 {count} 名符合条件会员",
    searchSubhint: "支持姓名、电话或专属会员卡号的双拼实时精确查询",
    exportExcel: "导出表格",
    backupDB: "备份数据库",
    restoreDB: "导入恢复",
    searchPlaceholder: "搜索会员姓名、11位电话、SWIM专属尾号...",
    allCapsText: "全部",
    activeText: "正常在状态",
    expiringText: "7天内到期",
    expiredText: "已过期",
    filterRemindersAll: "所有提醒",
    filterRemindersAlerted: "已发警报",
    filterRemindersNotAlerted: "未通知",

    // Table Columns
    colCardNo: "专属卡号",
    colBasicInfo: "基本信息",
    colPlanPrice: "卡型及实收",
    colValidityRange: "起止有效期",
    colRemainingDays: "状态 / 剩余期限",
    colAlertReminder: "警报提醒",
    colAction: "快捷操作",

    // Table Data Items
    expiredDaysAgo: "已到期 {days} 天",
    expiringDaysLeft: "即将到期 ({days}天)",
    activeDaysLeft: "正常在状态 ({days}天)",
    sentAlert: "已发送提醒",
    unsentAlert: "未发提醒",
    clickToToggleAlert: "点击切换是否发送催缴警报状态",

    // Operations Tooltips
    viewPass: "查看并打印游泳会员专属通行卡凭证",
    editInfo: "改动缴费、卡种或结束到期日期",
    deletePass: "退卡或彻底注销游泳池会员档案",
    noRecords: "未检索到任何符合条件的游泳会员记录。",
    resetSearch: "重置搜索",
    searchNoMatchDes: "没有找到符合 “{query}” 或者所选过滤条件的会员记录。请修改搜索条件，或点击右上角登记一个新游泳会员档案。",

    // Notices
    operationalNoticeTitle: "📚 游泳池业务实操工作流指南：",
    operationalNoticeBody: "前台登记时，根据会员付款类型（如次卡、季卡、年卡）新建档案，系统会自动计算到期月份。点击“查看卡片”即可显示带有加密核验算法的会员卡。支持普通黑白打印机直接打印（一正一反 3in x 2in），可将卡片装袋或贴在客户钥匙扣或游泳包上。救生员在池边随时可用手机或平板电脑点击“救生员扫码区”免密登录核验。扫码若提示绿屏幕则放行，红屏幕拒绝入水并提醒续卡。",
    viewSkillsBtn: "使用技巧说明",
    skillsAlertMsg: "使用开发技巧：建议定期通过【备份数据库】功能保存本地 JSON 备份文件。在本机核验调试时，您可直接用摄像头扫描所生成的图，亦或使用【上传会员卡图片】直接导入卡面截图秒级识别！",

    // Quick Alert Dialog
    remindersTitle: "到期提醒信息中心",
    remindersSubtitle: "包含 0~7 天内即将服务到期的游泳会员",
    remindersBanner: "当前系统内有 {count} 位会员将在一周以内过期停用。请柜台客服人员核对并尽快催缴续费。",
    remindersPhone: "联系电话",
    remindersPlan: "卡型",
    remindersAutomaticDeactivation: "服务将于到期当日零点由系统自动转换为不通过状态",
    remindersNoExpiring: "安心无忧！暂无即将到期人员",
    remindersNoExpiringBody: "当前数据库中没有任何游泳会员处于 7 天内即将过期的紧急状态。所有活跃用户的使用权限均在充裕时间段内。",
    closeStation: "关闭中心",
    copyTemplateBtn: "复制标准化短信话术模板",
    smsCopyAlert: "已为您自动生成‘中文提醒短信模板’并复制到剪贴板！\n\n您可直接粘贴给对应的会员。",

    // MemberForm Dialog
    newSwimmerTitle: "快捷登记新游泳会员",
    editSwimmerTitle: "修改会员信息 - {name}",
    newSwimmerFormSub: "输入会员基础数据，系统将全自动计算剩余使用天数和生成加密QR码卡面。",
    formSectionIdentity: "1. 会员识别与优惠方案",
    formSectionIdentityLabel: "会员专属通行识别卡号 (Card ID)",
    formPlanLabel: "会员卡种类期限计划 (Plan Series)",
    formSectionDetails: "2. 会员身份细节及付款金额",
    formName: "会员客户真实姓名",
    formPhone: "预留 11 位联系电话",
    formPrice: "本期实开收款金额 (RMB)",
    formDatePaid: "本次实收交纳日期 (Payment Date)",
    formSectionDates: "3. 通行资格起止有效期",
    formStartDate: "开始生效日期 (START)",
    formEndDate: "结束到期日期 (END)",
    formAutoEstimated: "系统自动估算",
    formRemarksHeader: "4. 内部行政附加备注与提醒状态",
    formRemarksLabel: "内部沟通备注 (如：常去浅水区/不习水性/过敏史/专用手卡储物格/教练指定)",
    formRemarksPlaceholder: "添加有关此会员的其他行政备注...",
    formCheckboxAlert: "在到期前由柜台电话或微信通知了该游泳客户",
    formCheckboxAlertSub: "勾选本项表示已有客务进行过续费通知，提醒本卡属于边缘到期跟踪会员。",
    buttonFormSave: "完成并保存会员通行档",
    buttonFormCancel: "取消并返回",

    // Member Pass Card Dialog
    cardVoucherTitle: "游泳会员专属通行凭证卡",
    cardVoucherSub: "打印机专用高对比度黑白裁剪排版设计，边缘包含 3in x 2in 标准剪刀裁切虚线",
    cardToggleLang: "中英切换",
    cardDaysRemaining: "本卡当前剩余天数",
    cardPaid: "缴费实收金额",
    cardPaymentDate: "缴费记录时间",
    cardAlertState: "催费通知提醒状态",
    cardEditState: "修改标记",
    cardPublicLink: "会员专属云核验网页链接 (GitHub Pages免登录核实地址)",
    cardCopyLink: "复制专属核验URL",
    cardNotesRemarks: "备注说明",
    btnPrintDouble: "黑白并排双面打印 (正面 + 背面 QR 3'' x 2'')",
    btnCloseCard: "关闭卡面预览",
    cardSmsCopied: "专属游泳校验链接复制成功！此链接部署在网页后，可免登录扫描直接核查状态。",

    // Card specifics
    frontSideTitle: "卡片正面预览 (信息标识面)",
    backSideTitle: "卡片反面预览 (特大二维码扫描面)",
    frontSideHead: "VIP 会员专属卡",
    backVerifyLabel: "海马游泳中心 • 会员资格通行认证",
    scanVerText: "微信或系统相机扫码 实时核验状态",
    qrDensityLabel: "简化二维码结构 (降低视觉像素密度)",
    qrDensitySub: "剔除冗余字段(手机号、卡计划)并降低纠错等级。让二维码点阵更干净、方块更大，热敏打印或小屏扫码时极易识别。",

    // Dialog Toggle
    btnShowFront: "显示正面卡片",
    btnShowBack: "显示反面卡片",

    // Family System Spec
    familyOptionHeader: "随同副卡家庭账户 (Family Sub-members Options)",
    familyOptionSub: "购买家庭卡或多人计划时，可在主会员下直接新增多个亲属副卡，使其拥有各自的多端ID卡。",
    btnAddFamilyMember: "添加家庭副卡成员",
    familyMemberName: "副卡使用者姓名",
    familyMemberRel: "与主卡关系 Relationship",
    familyMemberPhone: "副卡单独手机(选填)",
    familyRelationSpouse: "配偶 (Spouse)",
    familyRelationChild: "子女 (Child)",
    familyRelationParent: "父母 (Parent)",
    familyRelationOther: "其他成员 (Other)",
    familyRemoveBtn: "移除副卡",
    holderSelectorLabel: "请选择当前展示/打印的成员卡：",
    holderPrincipalName: "主账户人卡 (主卡 • {id})",
    holderSubName: "家庭随同人卡 (副卡 • {id} • {relationship})",
    primaryParentLabel: "主卡持有人 Account Swimmer Holder",
    subMemberDetails: "【副卡持有人】关联主账户: {name}",

    // Membership plan presets
    presetOnce: "次卡 (临时体验)",
    presetWeek: "周卡 (游泳体验卡)",
    presetMonth: "Month Pass",
    presetSeason: "季卡 (季度游泳卡)",
    presetHalfYear: "6-Month Pass",
    presetYear: "Year Pass",
    presetFamilyYear: "家庭年卡 (亲属共享卡)",
    customPlanLabel: "Custom Plan Category (自定义卡型)"
  }
};

export function getNormalizedPlanName(plan: string, lang: "en" | "zh"): string {
  if (!plan) return "";
  const normalized = plan.toLowerCase().trim();

  if (lang === "en") {
    if (normalized.includes("month") || normalized.includes("月卡") || normalized.includes("月")) {
      return "Month Pass";
    }
    if (normalized.includes("half-year") || normalized.includes("6-month") || normalized.includes("半年") || normalized.includes("半") || normalized.includes("6月")) {
      return "6-Month Pass";
    }
    if (normalized.includes("year") || normalized.includes("年卡") || normalized.includes("年") || normalized.includes("annual")) {
      return "Year Pass";
    }
    if (normalized.includes("family") || normalized.includes("家庭")) {
      return "Family Annual Pass";
    }
    if (normalized.includes("once") || normalized.includes("single") || normalized.includes("次卡") || normalized.includes("临时")) {
      return "Single Entry";
    }
    if (normalized.includes("week") || normalized.includes("周卡")) {
      return "Weekly Pass";
    }
    if (normalized.includes("custom") || normalized.includes("自定义")) {
      return "Custom Plan";
    }
  } else {
    // zh mode - keep uniform English standards for the main premium passes, with dual language helpers for specific others.
    if (normalized.includes("month") || normalized.includes("月卡") || normalized.includes("月")) {
      return "Month Pass";
    }
    if (normalized.includes("half-year") || normalized.includes("6-month") || normalized.includes("半年") || normalized.includes("半") || normalized.includes("6月")) {
      return "6-Month Pass";
    }
    if (normalized.includes("year") || normalized.includes("年卡") || normalized.includes("年") || normalized.includes("annual")) {
      return "Year Pass";
    }
    if (normalized.includes("family") || normalized.includes("家庭")) {
      return "家庭年卡 (Family Annual Pass)";
    }
    if (normalized.includes("once") || normalized.includes("single") || normalized.includes("次卡") || normalized.includes("临时")) {
      return "次卡 (Single Entry)";
    }
    if (normalized.includes("week") || normalized.includes("周卡")) {
      return "周卡 (Weekly Pass)";
    }
    if (normalized.includes("custom") || normalized.includes("自定义")) {
      return "自定义卡型 (Custom Plan)";
    }
  }

  return plan;
}

export function formatPhoneNumber(val: string): string {
  if (!val) return "";
  const digits = val.replace(/\D/g, "");
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  if (digits.length === 11) {
    if (digits.startsWith("1")) {
      return `(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return `(${digits.slice(0, 3)})${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)})${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

