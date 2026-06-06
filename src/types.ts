/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubMember {
  id: string; // generated card ID, e.g. "SWIM-1001-A"
  name: string;
  relationship: string; // Relationship: e.g. Spouse, Child, Parent, Other
  phone?: string;
  createdAt: string;
}

export interface Member {
  id: string; // 专属会员号码 (e.g., SWIM-1001)
  name: string; // 姓名
  phone: string; // 电话号码
  price: number; // 价格
  plan: string; // 会员计划 (e.g., 月卡, 季卡, 年卡)
  startDate: string; // 开始日期 YYYY-MM-DD
  endDate: string; // 结束日期 YYYY-MM-DD
  extraInfo: string; // 额外信息
  lastPaymentDate: string; // 上次付款日期 YYYY-MM-DD
  alertSent: boolean; // 是否已发送到期提醒
  createdAt: string; // 创建时间 ISO String
  subMembers?: SubMember[]; // 随同家庭副卡成员
}

export interface MembershipPlanPreset {
  nameKey: string; // standard key for translation
  durationDays: number;
  defaultPrice: number;
}

export const PLAN_PRESETS: MembershipPlanPreset[] = [
  { nameKey: "presetMonth", durationDays: 30, defaultPrice: 600 },
  { nameKey: "presetHalfYear", durationDays: 183, defaultPrice: 2600 },
  { nameKey: "presetYear", durationDays: 365, defaultPrice: 4500 },
];
