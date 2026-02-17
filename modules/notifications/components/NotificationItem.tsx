"use client";

import { Notification } from "../types/notification";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
        !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1.5">
          {!notification.isRead && (
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          )}
          {notification.isRead && <div className="w-2 h-2" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {notification.title}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {timeAgo(notification.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
            {notification.body}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {notification.senderName}
            </span>
            {notification.establishmentName && (
              <>
                <span className="text-xs text-gray-300 dark:text-gray-600">&middot;</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {notification.establishmentName}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
