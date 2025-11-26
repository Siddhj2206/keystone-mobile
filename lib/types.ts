// TypeScript interfaces matching backend JSON responses

export interface User {
  id: string;
  email: string;
  name: string;
  semesterStart: string;
  semesterEnd: string;
}

export interface Topic {
  id: string;
  title: string;
  parentId: string | null;
  estMinutes: number;
  currentMastery: number; // 0.0 to 1.0
  children?: Topic[];
  status: 'pending' | 'completed' | 'needs_revision';
}

export interface Subject {
  id: string;
  name: string;
  colorHex: string;
  topics: Topic[];
  progress: number; // 0.0 to 1.0
}

export interface StudySession {
  id: string;
  topicId: string;
  topicTitle: string;
  subjectColor: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  status: 'scheduled' | 'completed' | 'missed';
  sessionType: 'learning' | 'revision';
}

export interface FixedEvent {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string; // "14:00:00"
  endTime: string;
  colorHex: string;
}

export interface Assessment {
  id: string;
  title: string;
  date: string; // ISO String
  weightage: number; // 0-100
  topicIds: string[];
  subjectId: string;
}

// Form types
export interface CreateAssessmentInput {
  title: string;
  date: string;
  weightage: number;
  topicIds: string[];
}

export interface CompleteSessionInput {
  actualMinutes: number;
  needsMoreTime: boolean;
  remainingMinutes?: number;
}
