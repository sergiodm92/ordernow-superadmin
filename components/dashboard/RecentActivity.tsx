"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState, useMemo } from "react";
import { Activity } from "@/modules/admin/services/admin.service";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = null;
        if (!data || !Array.isArray(data) ) {
          setError(true);
          setActivities([]);
        } else {
          setActivities(data);
          setError(false);
        }
      } catch (error) {
        console.error('Error fetching recent activities:', error);
        setError(true);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const processedActivities = useMemo(() =>
    activities.map(activity => ({
      ...activity,
      initials: activity.name?.split(" ").map(n => n[0]).join("") || ""
    })),
    [activities]
  );

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="ml-4 space-y-1">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <Skeleton className="ml-auto h-4 w-[60px]" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && (error || activities.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No hay actividades recientes disponibles
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {processedActivities.map((activity, index) => (
        <div key={index} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${activity.email}`} />
            <AvatarFallback>
              {activity.initials}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.name}</p>
            <p className="text-sm text-muted-foreground">{activity.action}</p>
          </div>
          <div className="ml-auto font-medium text-sm text-muted-foreground">
            {activity.timestamp}
          </div>
        </div>
      ))}
    </div>
  );
}
