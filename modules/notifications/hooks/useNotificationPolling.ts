import { useEffect, useRef } from "react";
import { useAuthStore } from "@auth/store/auth";
import { useNotificationStore } from "../store/notificationStore";
import { getUnreadCount } from "../services/notificationService";

const POLLING_INTERVAL = 30000;

export const useNotificationPolling = () => {
  const token = useAuthStore((state) => state.token);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch {
        // Silently fail on polling errors
      }
    };

    fetchCount();
    intervalRef.current = setInterval(fetchCount, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, setUnreadCount]);
};
