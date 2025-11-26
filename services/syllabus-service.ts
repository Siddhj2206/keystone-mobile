import { api } from './api';
import type { Subject, Assessment, CreateAssessmentInput } from '@/lib/types';

export const syllabusService = {
  /**
   * Get all subjects with their topic trees
   */
  async getSubjects(): Promise<Subject[]> {
    const response = await api.get<Subject[]>(`/api/subjects`);
    return response.data;
  },

  /**
   * Get a single subject by ID
   */
  async getSubject(subjectId: string): Promise<Subject> {
    const response = await api.get<Subject>(`/api/subjects/${subjectId}`);
    return response.data;
  },

  /**
   * Upload a syllabus PDF for parsing
   */
  async uploadSyllabus(
    subjectId: string,
    fileUri: string,
    fileName: string
  ): Promise<Subject> {
    const formData = new FormData();
    // React Native FormData requires this specific shape for file uploads
    // The type assertion is necessary due to RN's non-standard FormData implementation
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'application/pdf',
    } as unknown as Blob);

    const response = await api.post<Subject>(
      `/api/subjects/${subjectId}/syllabus`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Create a new subject
   */
  async createSubject(data: { name: string; colorHex: string }): Promise<Subject> {
    const response = await api.post<Subject>(`/api/subjects`, data);
    return response.data;
  },

  /**
   * Get all assessments
   */
  async getAssessments(): Promise<Assessment[]> {
    const response = await api.get<Assessment[]>(`/api/assessments`);
    return response.data;
  },

  /**
   * Create a new assessment
   */
  async createAssessment(data: CreateAssessmentInput): Promise<Assessment> {
    const response = await api.post<Assessment>(`/api/assessments`, data);
    return response.data;
  },

  /**
   * Update topic mastery after completing a session
   */
  async updateTopicMastery(
    topicId: string,
    mastery: number
  ): Promise<void> {
    await api.patch(`/api/topics/${topicId}/mastery`, { mastery });
  },
};
