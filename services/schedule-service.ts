import { api } from './api';
import type { StudySession, FixedEvent, CompleteSessionInput } from '@/lib/types';

export interface DailyAgenda {
  sessions: StudySession[];
  fixedEvents: FixedEvent[];
}

export const scheduleService = {
  /**
   * Fetch agenda for a specific date
   */
  async getAgenda(date: string): Promise<DailyAgenda> {
    const response = await api.get<DailyAgenda>(`/api/schedule/agenda`, {
      params: { date },
    });
    return response.data;
  },

  /**
   * Mark a study session as complete
   */
  async completeSession(
    sessionId: string,
    data: CompleteSessionInput
  ): Promise<StudySession> {
    const response = await api.patch<StudySession>(
      `/api/study-sessions/${sessionId}/complete`,
      data
    );
    return response.data;
  },

  /**
   * Get sessions for a date range (for calendar view)
   */
  async getSessionsRange(
    startDate: string,
    endDate: string
  ): Promise<StudySession[]> {
    const response = await api.get<StudySession[]>(`/api/study-sessions`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Get fixed events (recurring classes, etc.)
   */
  async getFixedEvents(): Promise<FixedEvent[]> {
    const response = await api.get<FixedEvent[]>(`/api/fixed-events`);
    return response.data;
  },

  /**
   * Create a new fixed event
   */
  async createFixedEvent(
    data: Omit<FixedEvent, 'id'>
  ): Promise<FixedEvent> {
    const response = await api.post<FixedEvent>(`/api/fixed-events`, data);
    return response.data;
  },
};
