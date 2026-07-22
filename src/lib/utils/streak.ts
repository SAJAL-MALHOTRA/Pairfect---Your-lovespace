import { format, subDays } from "date-fns";

interface MoodLog {
  user_id: string;
  created_at: string;
}

export function calculateStreak(logs: MoodLog[], userAId: string, userBId: string | null): number {
  if (!userBId) return 0;

  // Group check-ins by user and calendar date (YYYY-MM-DD local style)
  const userACheckins = new Set<string>();
  const userBCheckins = new Set<string>();

  logs.forEach((log) => {
    const dateStr = format(new Date(log.created_at), "yyyy-MM-dd");
    if (log.user_id === userAId) {
      userACheckins.add(dateStr);
    } else if (log.user_id === userBId) {
      userBCheckins.add(dateStr);
    }
  });

  let streak = 0;
  const currentDate = new Date();
  
  // Check if both checked in today
  const todayStr = format(currentDate, "yyyy-MM-dd");
  const bothCheckedInToday = userACheckins.has(todayStr) && userBCheckins.has(todayStr);

  // If both didn't check in today, check if they both checked in yesterday to keep streak active
  const yesterdayStr = format(subDays(currentDate, 1), "yyyy-MM-dd");
  const bothCheckedInYesterday = userACheckins.has(yesterdayStr) && userBCheckins.has(yesterdayStr);

  if (!bothCheckedInToday && !bothCheckedInYesterday) {
    return 0;
  }

  // Start counting backward
  let checkDate = bothCheckedInToday ? currentDate : subDays(currentDate, 1);
  
  while (true) {
    const checkDateStr = format(checkDate, "yyyy-MM-dd");
    if (userACheckins.has(checkDateStr) && userBCheckins.has(checkDateStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }

  return streak;
}
