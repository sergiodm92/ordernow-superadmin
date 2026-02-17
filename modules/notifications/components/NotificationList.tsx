"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Notification } from "../types/notification";
import { getNotifications, markAsRead, markAllAsRead } from "../services/notificationService";
import { useNotificationStore } from "../store/notificationStore";
import { NotificationItem } from "./NotificationItem";
import { CheckCheck } from "lucide-react";

interface NotificationListProps {
  maxHeight?: string;
}

export function NotificationList({ maxHeight = "400px" }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const { decrementUnreadCount, resetUnreadCount } = useNotificationStore();

  const fetchNotifications = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const data = await getNotifications(pageNum, 10);
      setNotifications((prev) => (append ? [...prev, ...data.content] : data.content));
      setHasMore(!data.last);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(0);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      decrementUnreadCount();
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      resetUnreadCount();
    } catch {
      // Silently fail
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMarkAllAsRead}
          className="text-xs h-7 px-2"
        >
          <CheckCheck className="h-3.5 w-3.5 mr-1" />
          Mark all read
        </Button>
      </div>
      <ScrollArea style={{ maxHeight }}>
        {notifications.length === 0 && !loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
            {hasMore && (
              <div className="px-4 py-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-xs"
                >
                  {loading ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  );
}
