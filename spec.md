This is the detailed technical specification for **`keystone-frontend`**.

It focuses entirely on the React Native implementation, State Management, and UI Components. Use this to structure your Expo project.

***

# Frontend Specification: Keystone
**Project:** Keystone Mobile App
**Framework:** React Native (Expo SDK 54+)
**Language:** TypeScript
**Architecture:** Feature-based / Expo Router
**Design System:** Brutalist Monospace

---

## 1. Tech Stack & Dependencies

| Category | Library | Purpose |
| :--- | :--- | :--- |
| **Core** | `expo` ~54 | Build toolchain & SDK. |
| **Routing** | `expo-router` | File-based navigation (Stack/Tabs). |
| **State** | `zustand` | Global state management. |
| **Networking** | `axios` | HTTP Client (with Interceptors). |
| **Calendar** | `react-native-calendars` | Calendar picker & timeline components. |
| **Files** | `expo-document-picker` | Uploading PDF Syllabi. |
| **Storage** | `expo-secure-store` | Storing Auth Tokens. |
| **Safe Area** | `react-native-safe-area-context` | Safe area insets handling. |

---

## 2. Directory Structure

Follow the **Expo Router** convention strictly.

```text
/keystone-mobile
  /app
    /(auth)
      _layout.tsx             <-- Auth layout
      login.tsx               <-- Login Screen
      register.tsx            <-- Register Screen
    /(tabs)
      _layout.tsx             <-- Tab Bar Config
      index.tsx               <-- TAB 1: Timeline (Home)
      subjects.tsx            <-- TAB 2: Subjects List
      exams.tsx               <-- TAB 3: Exams & Assessments
    /subjects
      [id].tsx                <-- Subject Detail (view/edit)
    /exams
      [id].tsx                <-- Exam Detail (view/edit)
    /modals
      add-exam.tsx            <-- Modal: Create Assessment
      add-subject.tsx         <-- Modal: Create Subject
      upload-syllabus.tsx     <-- Modal: PDF Picker & Preview
      complete-session.tsx    <-- Bottom Sheet: Check-off task
    _layout.tsx               <-- Root Layout (Providers)
  
  /components
    /ui
      button.tsx              <-- Brutalist button
      input.tsx               <-- Brutalist input
      card.tsx                <-- Brutalist card
      collapsible.tsx         <-- Collapsible section
    /schedule
      time-block.tsx          <-- The colored agenda item
      timeline-view.tsx       <-- Wrapper for RN-Calendars
    /syllabus
      topic-tree.tsx          <-- Recursive Topic Component

  /stores                     <-- Zustand Stores
    use-schedule-store.ts
    use-syllabus-store.ts
    use-ui-store.ts

  /services                   <-- API Calls
    api.ts                    <-- Axios Instance (Base URL)
    syllabus-service.ts
    schedule-service.ts

  /constants
    theme.ts                  <-- Brutalist Design System

  /lib
    types.ts                  <-- TypeScript Interfaces
    auth-client.ts            <-- Auth utilities
    time-utils.ts             <-- Time validation/formatting

  /hooks
    use-color-scheme.ts       <-- Theme detection
    use-theme-color.ts        <-- Theme color getter
```

---

## 3. TypeScript Interfaces (The Contract)

Located in `lib/types.ts`. These must match the Backend JSON responses.

```typescript
// lib/types.ts

export interface User {
  id: string;
  email: string;
  semesterStart: string;
  semesterEnd: string;
}

export interface Topic {
  id: string;
  title: string;
  parentId: string | null;
  estMinutes: number;
  currentMastery: number; // 0.0 to 1.0
  children?: Topic[];     // Recursive structure
  status: 'pending' | 'completed' | 'needs_revision';
}

export interface Subject {
  id: string;
  name: string;
  colorHex: string;
  progress: number;       // 0.0 to 1.0
  topics: Topic[];
  classSlots?: ClassSlot[];
}

export interface ClassSlot {
  id: string;
  dayOfWeek: number;      // 0 = Sunday, 6 = Saturday
  startTime: string;      // "HH:MM"
  endTime: string;        // "HH:MM"
}

export interface Assessment {
  id: string;
  title: string;
  date: string;           // ISO String
  weightage: number;      // 0-100
  topicIds: string[];
  subjectId: string;
}

export interface StudySession {
  id: string;
  topicId: string;
  topicTitle: string;     // Hydrated by backend
  subjectColor: string;   // Hydrated by backend
  startTime: string;      // ISO String
  endTime: string;        // ISO String
  status: 'scheduled' | 'completed' | 'missed';
  sessionType: 'learning' | 'revision';
}
```

---

## 4. State Management (Zustand)

We use **3 distinct stores** to keep logic clean.

### 4.1 `useScheduleStore`
Manages the Daily Timeline.
*   **State:**
    *   `selectedDate`: string (YYYY-MM-DD)
    *   `sessions`: `StudySession[]`
    *   `isLoading`: boolean
*   **Actions:**
    *   `fetchAgenda(date)`: Calls API, populates `sessions`.
    *   `markComplete(sessionId, actualMinutes)`: Optimistic update -> API Call.

### 4.2 `useSyllabusStore`
Manages Subjects, Topics, and Assessments.
*   **State:**
    *   `subjects`: `Subject[]` (including nested topics)
    *   `assessments`: `Assessment[]`
    *   `isLoading`: boolean
    *   `error`: string | null
*   **Actions:**
    *   `fetchSubjects()`: Get all subjects with topics.
    *   `fetchAssessments()`: Get all assessments.
    *   `createSubject(name, colorHex, classSlots?)`: Create new subject.
    *   `updateSubject(id, data)`: Update subject details.
    *   `createAssessment(data)`: Create new assessment.
    *   `updateAssessment(id, data)`: Update assessment details.
    *   `uploadSyllabus(subjectId, fileUri, fileName)`: Upload PDF syllabus.
    *   `getSubjectById(id)`: Get subject by ID.
    *   `getAssessmentById(id)`: Get assessment by ID.

### 4.3 `useUIStore`
Manages temporary UI state.
*   **State:**
    *   `isFabOpen`: boolean
    *   `activeModal`: string | null

---

## 5. Screen Specifications

### 5.1 Tab 1: Timeline (Home)
**Path:** `app/(tabs)/index.tsx`

*   **Header:** Date display with navigation arrows.
*   **Body:** Timeline view showing study sessions.
*   **Session Cards:** Display topic, time, subject color.
*   **Interaction:** Tap session to mark complete.

### 5.2 Tab 2: Subjects
**Path:** `app/(tabs)/subjects.tsx`

*   **Layout:** ScrollView with subject cards.
*   **Subject Card:** Shows name, color bar, progress, topic count.
*   **Interaction:** Tap to navigate to subject detail.
*   **Action:** "ADD SUBJECT" button opens add-subject modal.

### 5.3 Tab 3: Exams
**Path:** `app/(tabs)/exams.tsx`

*   **Layout:** ScrollView with exam cards.
*   **Sections:** Upcoming exams, past exams.
*   **Exam Card:** Shows title, date, days until, weightage, subject.
*   **Interaction:** Tap to navigate to exam detail.
*   **Action:** "ADD EXAM" button opens add-exam modal.

### 5.4 Subject Detail
**Path:** `app/subjects/[id].tsx`

*   **View Mode:**
    *   Subject name with color bar
    *   Progress bar and stats (topics, completed, needs revision)
    *   Class schedule display (if class slots exist)
    *   Upcoming sessions for this subject
    *   Topic tree (collapsible, shows mastery)
*   **Edit Mode:** (toggle with [EDIT] button)
    *   Edit subject name
    *   Color picker grid
    *   Manage class schedule (add/remove time slots)
    *   Save/Cancel in footer

### 5.5 Exam Detail
**Path:** `app/exams/[id].tsx`

*   **View Mode:**
    *   Exam title with subject color bar
    *   Status badge (days until / completed)
    *   Stats row (weightage, topics count, date)
    *   Topics covered list
*   **Edit Mode:** (toggle with [EDIT] button)
    *   Edit exam title
    *   Date picker (calendar modal)
    *   Weightage input
    *   Subject selector
    *   Topic selector (recursive checkboxes)
    *   Save/Cancel in footer

### 5.6 Modal: Add Subject
**Path:** `app/modals/add-subject.tsx`

*   **Form:**
    *   Subject name (Input)
    *   Color picker (grid of swatches)
    *   Weekly schedule (optional class times)
*   **Submit:** Creates subject and navigates to detail page.

### 5.7 Modal: Add Assessment
**Path:** `app/modals/add-exam.tsx`

*   **Form:**
    *   Title (Input)
    *   Date (Calendar picker)
    *   Weightage (Input 0-100%)
    *   Subject selector
    *   Topic selector (recursive checkboxes)
*   **Submit:** Creates assessment.

### 5.8 Modal: Complete Session
**Path:** `app/modals/complete-session.tsx`

*   **Type:** Modal with mastery slider.
*   **Content:**
    *   Topic name and subject
    *   Mastery slider (0-100%)
    *   Confirm button
*   **Logic:** Updates topic mastery via API.

---

## 6. Design System: Brutalist Monospace

Defined in `constants/theme.ts`.

### 6.1 Colors

```typescript
export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    border: '#000000',
    surface: '#F5F5F5',
    accent: '#0000FF',      // Primary blue
    muted: '#666666',
    success: '#00AA00',
    warning: '#FFAA00',
    error: '#FF0000',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    border: '#FFFFFF',
    surface: '#111111',
    accent: '#00FF00',      // Primary green
    muted: '#888888',
    success: '#00FF00',
    warning: '#FFCC00',
    error: '#FF3333',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const SubjectColors = [
  '#FF0000', '#00AA00', '#0000FF', '#FF6600',
  '#AA00AA', '#00AAAA', '#AAAA00', '#FF00FF',
] as const;
```

### 6.2 Typography

*   **All text:** Monospace fonts only
*   **Hierarchy:** Font weight (bold/regular) and size
*   **Case:** UPPERCASE for headers/labels

### 6.3 Spacing

```typescript
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
```

### 6.4 Borders

```typescript
export const Borders = {
  thin: 1,
  regular: 2,
  thick: 3,
  heavy: 4,
} as const;
```

### 6.5 Component Guidelines

*   **Buttons:** Rectangular, thick borders, solid fills, uppercase text
*   **Cards:** Heavy borders, no elevation, stark background contrast
*   **Inputs:** Outlined style only, monospace text, thick borders
*   **Corners:** Sharp (borderRadius: 0) or minimal (4px max)

---

## 7. Shared Utilities

### 7.1 Time Utils (`lib/time-utils.ts`)

```typescript
// Validate HH:MM format
export const isValidTime = (time: string): boolean => { ... }

// Normalize to HH:MM (zero-padded)
export const normalizeTime = (time: string): string => { ... }
```

### 7.2 Constants (`constants/theme.ts`)

```typescript
// Days of week for schedule UI
export const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
```

---

## 8. UX Patterns

### 8.1 Detail Page Edit Flow

Both Subject and Exam detail pages follow the same pattern:

1. **View Mode:** Display all information read-only
2. **Edit Toggle:** `[EDIT]` button in header (right side)
3. **Edit Mode:** Form fields replace display, footer shows Save/Cancel
4. **Cancel:** `< CANCEL` in header OR Cancel button in footer
5. **Save:** Validates and saves, returns to view mode

### 8.2 Navigation

*   **Back:** `< BACK` text button in header (left)
*   **Edit:** `[EDIT]` text button in header (right)
*   **Modals:** Full-screen with Cancel/Submit actions

---

## 9. Implementation Status

### Completed
- [x] Project setup with Expo SDK 54
- [x] File-based routing with expo-router
- [x] Brutalist design system (theme.ts)
- [x] Tab navigation (Timeline, Subjects, Exams)
- [x] Subject list and detail pages (view/edit)
- [x] Exam list and detail pages (view/edit)
- [x] Add Subject modal with class schedule
- [x] Add Exam modal with topic selection
- [x] Topic tree component with mastery display
- [x] Zustand stores (schedule, syllabus, UI)
- [x] Guest mode with mock data
- [x] Time utilities extraction

### Pending
- [ ] Backend API integration
- [ ] User authentication flow
- [ ] PDF syllabus upload and parsing
- [ ] Timeline view with react-native-calendars
- [ ] Session completion flow
- [ ] Push notifications
