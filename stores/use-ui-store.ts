import { create } from 'zustand';

type ModalType = 'add_exam' | 'upload_syllabus' | 'complete_session' | null;

interface UIState {
  // State
  activeModal: ModalType;
  selectedSessionId: string | null;
  selectedSubjectId: string | null;

  // Actions
  openModal: (modal: ModalType, params?: { sessionId?: string; subjectId?: string }) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  activeModal: null,
  selectedSessionId: null,
  selectedSubjectId: null,

  // Actions
  openModal: (modal, params) => {
    set({
      activeModal: modal,
      selectedSessionId: params?.sessionId ?? null,
      selectedSubjectId: params?.subjectId ?? null,
    });
  },

  closeModal: () => {
    set({
      activeModal: null,
      selectedSessionId: null,
      selectedSubjectId: null,
    });
  },
}));
