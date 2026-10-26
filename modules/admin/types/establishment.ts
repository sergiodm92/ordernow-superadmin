import { Schemas } from "@/types/api";

// Mirrors the backend's EstablishmentResponseDto / CreateEstablishmentDto / UpdateEstablishmentDto
// (GET/POST/PUT /establishments).
export type IEstablishment = Schemas["EstablishmentResponseDto"];
export type CreateEstablishmentDto = Schemas["CreateEstablishmentDto"];
export type UpdateEstablishmentDto = Schemas["UpdateEstablishmentDto"];

export interface IEstablishmentSettings {
  id: number;
  establishmentId: number;

  // Theme
  themeMode: string;
  primaryColor: string;
  accentColor: string;
  borderRadius: number;
  fontSize: string;

  // Layout
  sidebarCollapsed: boolean;
  compactMode: boolean;
  showBreadcrumbs: boolean;
  animationsEnabled: boolean;
  density: string;

  // Branding
  logoUrl: string | null;
  faviconUrl: string | null;
  brandName: string | null;
  tagline: string | null;
  brandPrimaryColor: string | null;
  brandSecondaryColor: string | null;

  // Localization
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: string;

  // Notifications - Email
  emailNewOrders: boolean;
  emailLowStock: boolean;
  emailDailyReports: boolean;
  emailPromotions: boolean;
  emailSystemUpdates: boolean;

  // Notifications - Push
  pushNewOrders: boolean;
  pushCustomerMessages: boolean;
  pushUrgentAlerts: boolean;
  pushReminders: boolean;

  // Notifications - Sound
  soundEnabled: boolean;
  soundVolume: number;
  soundNewOrder: boolean;
  soundAlert: boolean;

  // Notifications - Schedule
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  // Security - Sessions
  autoLogout: boolean;
  sessionTimeoutMinutes: number;
  maxSessions: number;

  // Security - Access
  ipWhitelistEnabled: boolean;
  allowedIPs: string | null;
  deviceTracking: boolean;
  locationTracking: boolean;

  // Security - Password Policy
  requireStrongPassword: boolean;
  passwordExpirationDays: number;
  preventPasswordReuse: boolean;
  passwordHistoryCount: number;
}

export interface IEstablishmentTable {
  id: number;
  number: string;
  capacity: number;
  type: TableType;
  state: TableState;
  positionX: number;
  positionY: number;
  establishmentId: number;
}

export enum TableType {
  STANDARD = "STANDARD",
  VIP = "VIP",
  OUTDOOR = "OUTDOOR",
  BAR = "BAR"
}

export enum TableState {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  RESERVED = "RESERVED",
  OUT_OF_SERVICE = "OUT_OF_SERVICE"
}