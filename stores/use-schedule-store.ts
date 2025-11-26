import { create } from 'zustand';

import { scheduleService, type DailyAgenda } from '@/services/schedule-service';
import { guestAuth } from '@/lib/auth-client';
import type { StudySession, FixedEvent, CompleteSessionInput } from '@/lib/types';

// Mock data for guest mode
const MOCK_SESSIONS: StudySession[] = [
  {
    id: '1',
    topicId: '1a',
    topicTitle: 'Vectors & Spaces',
    subjectColor: '#0000FF',
    startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    status: 'scheduled',
    sessionType: 'learning',
  },
  {
    id: '2',
    topicId: '2a',
    topicTitle: 'Integration Techniques',
    subjectColor: '#FF6600',
    startTime: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
    status: 'scheduled',
    sessionType: 'revision',
  },
  {
    id: '3',
    topicId: '3a',
    topicTitle: 'Mechanics',
    subjectColor: '#00AA00',
    startTime: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
    status: 'scheduled',
    sessionType: 'learning',
  },
];

const MOCK_FIXED_EVENTS: FixedEvent[] = [
  {
    id: 'f1',
    title: 'Physics Lecture',
    dayOfWeek: new Date().getDay(),
    startTime: '11:00:00',
    endTime: '12:00:00',
    colorHex: '#888888',
  },
];

interface ScheduleState {
  // State
  selectedDate: string;
  sessions: StudySession[];
  fixedEvents: FixedEvent[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedDate: (date: string) => void;
  fetchAgenda: (date: string) => Promise<void>;
  markComplete: (sessionId: string, data: CompleteSessionInput) => Promise<void>;
  refreshFixedEvents: () => Promise<void>;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  // Initial state
  selectedDate: formatDate(new Date()),
  sessions: [],
  fixedEvents: [],
  isLoading: false,
  error: null,

  // Actions
  setSelectedDate: (date: string) => {
    if (date === get().selectedDate) return;
    set({ selectedDate: date });
    // Fire-and-forget with error handling
    get().fetchAgenda(date).catch((error) => {
      if (__DEV__) console.error('Failed to fetch agenda:', error);
    });
  },

  fetchAgenda: async (date: string) => {
    set({ isLoading: true, error: null });

    // Check if guest mode
    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      // Return mock data for guest mode
      set({
        sessions: MOCK_SESSIONS.map((s) => ({
          ...s,
          startTime: new Date(date + 'T' + new Date(s.startTime).toTimeString().slice(0, 8)).toISOString(),
          endTime: new Date(date + 'T' + new Date(s.endTime).toTimeString().slice(0, 8)).toISOString(),
        })),
        fixedEvents: MOCK_FIXED_EVENTS,
        isLoading: false,
      });
      return;
    }

    try {
      const agenda: DailyAgenda = await scheduleService.getAgenda(date);
      set({
        sessions: agenda.sessions,
        fixedEvents: agenda.fixedEvents,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch agenda',
        isLoading: false,
      });
    }
  },

  markComplete: async (sessionId: string, data: CompleteSessionInput) => {
    // Optimistic update
    const previousSessions = get().sessions;
    set({
      sessions: previousSessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'completed' as const } : s
      ),
    });

    // Check if guest mode - just keep the optimistic update
    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      return;
    }

    try {
      const updatedSession = await scheduleService.completeSession(sessionId, data);
      set({
        sessions: get().sessions.map((s) =>
          s.id === sessionId ? updatedSession : s
        ),
      });
    } catch (error) {
      // Rollback on error
      set({ sessions: previousSessions });
      throw error;
    }
  },

  refreshFixedEvents: async () => {
    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      set({ fixedEvents: MOCK_FIXED_EVENTS });
      return;
    }

    try {
      const fixedEvents = await scheduleService.getFixedEvents();
      set({ fixedEvents });
    } catch (error) {
      if (__DEV__) console.error('Failed to refresh fixed events:', error);
    }
  },
}));
