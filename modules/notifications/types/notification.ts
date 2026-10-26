import { ApiData, Schemas } from "@/types/api";

// PaginatedNotifications has no `last` field — derive "has more pages" from `number`/`totalPages`
// (see NotificationList.tsx).
export type Notification = Schemas["NotificationResponseDto"];
export type NotificationPage = ApiData<"/api/v1/notifications", "get">;
export type CreateNotificationPayload = Schemas["CreateNotificationDto"];
