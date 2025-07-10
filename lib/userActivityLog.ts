// User activity log system
export interface UserActivity {
  id: string;
  username: string;
  userId: string;
  action: string;
  status: 'success' | 'failed';
  details: string;
  timestamp: number;
}

// Simple in-memory storage (in a real app, use a database)
let activityLog: UserActivity[] = [];

export function logUserActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>) {
  const newActivity: UserActivity = {
    ...activity,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };
  
  activityLog.unshift(newActivity); // Add to beginning
  
  // Keep only last 100 activities
  if (activityLog.length > 100) {
    activityLog = activityLog.slice(0, 100);
  }
  
  return newActivity;
}

export function getActivityLog(): UserActivity[] {
  return activityLog;
}

export function clearActivityLog(): void {
  activityLog = [];
}
