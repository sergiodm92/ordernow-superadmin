import api from "@/config/api.axios";
import { ApiData } from "@/types/api";
import { CreateNotificationPayload, NotificationPage } from "../types/notification";

export const getNotifications = async (page: number, size: number): Promise<NotificationPage> => {
  const response = await api.get<{ data: NotificationPage }>(`/notifications?page=${page}&size=${size}`);
  return response.data.data;
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<{ data: ApiData<"/api/v1/notifications/unread-count", "get"> }>(
    "/notifications/unread-count"
  );
  return response.data.data;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.put(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.put("/notifications/read-all");
};

export const createNotification = async (payload: CreateNotificationPayload): Promise<void> => {
  await api.post("/notifications", payload);
};
