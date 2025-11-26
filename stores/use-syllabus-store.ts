import { create } from 'zustand';

import { syllabusService } from '@/services/syllabus-service';
import { guestAuth } from '@/lib/auth-client';
import type { Subject, Assessment, CreateAssessmentInput } from '@/lib/types';

// Mock data for guest mode
const MOCK_SUBJECTS: Subject[] = [
  {
    id: '1',
    name: 'Linear Algebra',
    colorHex: '#0000FF',
    progress: 0.45,
    topics: [
      {
        id: '1a',
        title: 'Vectors & Spaces',
        parentId: null,
        estMinutes: 120,
        currentMastery: 0.8,
        status: 'completed',
        children: [
          { id: '1a1', title: 'Vector Operations', parentId: '1a', estMinutes: 45, currentMastery: 0.9, status: 'completed', children: [] },
          { id: '1a2', title: 'Linear Independence', parentId: '1a', estMinutes: 60, currentMastery: 0.7, status: 'completed', children: [] },
        ],
      },
      {
        id: '1b',
        title: 'Matrix Operations',
        parentId: null,
        estMinutes: 90,
        currentMastery: 0.6,
        status: 'pending',
        children: [
          { id: '1b1', title: 'Matrix Multiplication', parentId: '1b', estMinutes: 45, currentMastery: 0.8, status: 'completed', children: [] },
          { id: '1b2', title: 'Inverse Matrices', parentId: '1b', estMinutes: 45, currentMastery: 0.4, status: 'pending', children: [] },
        ],
      },
      { id: '1c', title: 'Eigenvalues', parentId: null, estMinutes: 120, currentMastery: 0.2, status: 'pending', children: [] },
    ],
  },
  {
    id: '2',
    name: 'Calculus II',
    colorHex: '#FF6600',
    progress: 0.72,
    topics: [
      { id: '2a', title: 'Integration Techniques', parentId: null, estMinutes: 90, currentMastery: 0.9, status: 'completed', children: [] },
      { id: '2b', title: 'Series & Sequences', parentId: null, estMinutes: 120, currentMastery: 0.7, status: 'needs_revision', children: [] },
      { id: '2c', title: 'Differential Equations', parentId: null, estMinutes: 150, currentMastery: 0.5, status: 'pending', children: [] },
    ],
  },
  {
    id: '3',
    name: 'Physics',
    colorHex: '#00AA00',
    progress: 0.33,
    topics: [
      { id: '3a', title: 'Mechanics', parentId: null, estMinutes: 180, currentMastery: 0.6, status: 'pending', children: [] },
      { id: '3b', title: 'Electromagnetism', parentId: null, estMinutes: 200, currentMastery: 0.2, status: 'pending', children: [] },
      { id: '3c', title: 'Thermodynamics', parentId: null, estMinutes: 150, currentMastery: 0.1, status: 'pending', children: [] },
    ],
  },
];

// Helper to get dates relative to today
const daysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 'exam-1',
    title: 'Linear Algebra Midterm',
    date: daysFromNow(5),
    weightage: 25,
    topicIds: ['1a', '1a1', '1a2', '1b', '1b1', '1b2'],
    subjectId: '1',
  },
  {
    id: 'exam-2',
    title: 'Calculus II Quiz',
    date: daysFromNow(12),
    weightage: 10,
    topicIds: ['2a', '2b'],
    subjectId: '2',
  },
  {
    id: 'exam-3',
    title: 'Physics Final',
    date: daysFromNow(21),
    weightage: 40,
    topicIds: ['3a', '3b', '3c'],
    subjectId: '3',
  },
  {
    id: 'exam-4',
    title: 'Calculus II Midterm',
    date: daysFromNow(-7),
    weightage: 20,
    topicIds: ['2a'],
    subjectId: '2',
  },
];

interface SyllabusState {
  // State
  subjects: Subject[];
  assessments: Assessment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSubjects: () => Promise<void>;
  fetchAssessments: () => Promise<void>;
  uploadSyllabus: (subjectId: string, fileUri: string, fileName: string) => Promise<void>;
  createSubject: (name: string, colorHex: string) => Promise<Subject>;
  createAssessment: (data: CreateAssessmentInput) => Promise<Assessment>;
  updateAssessment: (id: string, data: Partial<Assessment>) => Promise<void>;
  getSubjectById: (id: string) => Subject | undefined;
  getAssessmentById: (id: string) => Assessment | undefined;
  getTotalProgress: () => number;
}

export const useSyllabusStore = create<SyllabusState>((set, get) => ({
  // Initial state
  subjects: [],
  assessments: [],
  isLoading: false,
  error: null,

  // Actions
  fetchSubjects: async () => {
    set({ isLoading: true, error: null });

    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      set({ subjects: MOCK_SUBJECTS, isLoading: false });
      return;
    }

    try {
      const subjects = await syllabusService.getSubjects();
      set({ subjects, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch subjects',
        isLoading: false,
      });
    }
  },

  fetchAssessments: async () => {
    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      set({ assessments: MOCK_ASSESSMENTS });
      return;
    }

    try {
      const assessments = await syllabusService.getAssessments();
      set({ assessments });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch assessments' });
      if (__DEV__) console.error('Failed to fetch assessments:', error);
    }
  },

  uploadSyllabus: async (subjectId: string, fileUri: string, fileName: string) => {
    set({ isLoading: true, error: null });

    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      // Simulate upload in guest mode
      set({ isLoading: false });
      return;
    }

    try {
      const updatedSubject = await syllabusService.uploadSyllabus(
        subjectId,
        fileUri,
        fileName
      );
      set({
        subjects: get().subjects.map((s) =>
          s.id === subjectId ? updatedSubject : s
        ),
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to upload syllabus',
        isLoading: false,
      });
      throw error;
    }
  },

  createSubject: async (name: string, colorHex: string) => {
    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      const newSubject: Subject = {
        id: `guest-${Date.now()}`,
        name,
        colorHex,
        progress: 0,
        topics: [],
      };
      set({ subjects: [...get().subjects, newSubject] });
      return newSubject;
    }

    const newSubject = await syllabusService.createSubject({ name, colorHex });
    set({ subjects: [...get().subjects, newSubject] });
    return newSubject;
  },

  createAssessment: async (data: CreateAssessmentInput) => {
    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      const newAssessment: Assessment = {
        id: `guest-${Date.now()}`,
        title: data.title,
        date: data.date,
        weightage: data.weightage,
        topicIds: data.topicIds,
        subjectId: '',
      };
      set({ assessments: [...get().assessments, newAssessment] });
      return newAssessment;
    }

    const newAssessment = await syllabusService.createAssessment(data);
    set({ assessments: [...get().assessments, newAssessment] });
    return newAssessment;
  },

  getSubjectById: (id: string) => {
    return get().subjects.find((s) => s.id === id);
  },

  getAssessmentById: (id: string) => {
    return get().assessments.find((a) => a.id === id);
  },

  updateAssessment: async (id: string, data: Partial<Assessment>) => {
    const isGuest = await guestAuth.isGuestMode();
    if (isGuest) {
      set({
        assessments: get().assessments.map((a) =>
          a.id === id ? { ...a, ...data } : a
        ),
      });
      return;
    }

    try {
      const updatedAssessment = await syllabusService.updateAssessment(id, data);
      set({
        assessments: get().assessments.map((a) =>
          a.id === id ? updatedAssessment : a
        ),
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update assessment' });
      throw error;
    }
  },

  getTotalProgress: () => {
    const subjects = get().subjects;
    if (subjects.length === 0) return 0;
    const totalProgress = subjects.reduce((acc, s) => acc + s.progress, 0);
    return totalProgress / subjects.length;
  },
}));
