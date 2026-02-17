export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "PLATFORM" | "ESTABLISHMENT";
  senderName: string;
  establishmentName: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export interface CreateNotificationPayload {
  title: string;
  body: string;
  type: "PLATFORM" | "ESTABLISHMENT";
  establishmentId?: number;
}

export interface UnreadCount {
  count: number;
}
