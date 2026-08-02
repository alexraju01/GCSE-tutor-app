// src/modules/dashboard/dashboard.types.ts
export interface TeacherDashboardStats {
  totalEarnings: number;
  completedLessons: number;
  activeStudents: number;
  totalHoursTaught: number;
}

export interface StudentDashboardStats {
  totalLessonsBooked: number;
  completedLessons: number;
  upcomingLessons: number;
  totalHoursLearned: number;
}
