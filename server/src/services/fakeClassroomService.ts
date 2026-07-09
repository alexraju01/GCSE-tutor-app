export interface ClassroomSession {
  roomId: string;
  className: string;
  teacherId: string;
  isActive: boolean;
  createdAt: Date;
}

// In-memory store to simulate a database
const mockSessions = new Map<string, ClassroomSession>([
  [
    "math-101",
    {
      roomId: "math-101",
      className: "Year 11 Pure Mathematics",
      teacherId: "teacher-alex",
      isActive: true,
      createdAt: new Date(),
    },
  ],
  [
    "sci-202",
    {
      roomId: "sci-202",
      className: "GCSE Physics - Forces",
      teacherId: "teacher-jacob",
      isActive: false,
      createdAt: new Date(Date.now() - 86400000),
    },
  ],
]);

export const fakeClassroomService = {
  /**
   * Retrieves an active classroom session by its room ID
   */
  getClassroomByRoomId: async (roomId: string): Promise<ClassroomSession | null> => {
    // Simulate slight network latency
    await new Promise((resolve) => setTimeout(resolve, 150));

    const session = mockSessions.get(roomId);
    if (!session) return null;

    return session;
  },

  /**
   * Creates a brand new mock classroom session
   */
  createClassroom: async (className: string, teacherId: string): Promise<ClassroomSession> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const roomId = `${className.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSession: ClassroomSession = {
      roomId,
      className,
      teacherId,
      isActive: true,
      createdAt: new Date(),
    };

    mockSessions.set(roomId, newSession);
    return newSession;
  },

  /**
   * Simulates closing/ending a classroom session
   */
  endClassroom: async (roomId: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const session = mockSessions.get(roomId);
    if (!session) return false;

    mockSessions.set(roomId, { ...session, isActive: false });
    return true;
  },
};
