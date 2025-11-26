This is the detailed technical specification for **`keystone-frontend`**.

It focuses entirely on the React Native implementation, State Management, and UI Components. Use this to structure your Expo project.

***

# Frontend Specification: Keystone
**Project:** Keystone Mobile App
**Framework:** React Native (Expo SDK 50+)
**Language:** TypeScript
**Architecture:** Feature-based / Expo Router

---

## 1. Tech Stack & Dependencies

| Category | Library | Purpose |
| :--- | :--- | :--- |
| **Core** | `expo` | Build toolchain & SDK. |
| **Routing** | `expo-router` | File-based navigation (Stack/Tabs). |
| **State** | `zustand` | Global state management. |
| **Networking** | `axios` | HTTP Client (with Interceptors). |
| **Calendar** | `react-native-calendars` | The specific `TimelineList` component. |
| **Files** | `expo-document-picker` | Uploading PDF Syllabi. |
| **UI Components** | `lucide-react-native` | Icons. |
| **Storage** | `expo-secure-store` | Storing Auth Tokens. |
| **Gestures** | `react-native-gesture-handler` | For dragging schedule blocks. |

---

## 2. Directory Structure

Follow the **Expo Router** convention strictly.

```text
/keystone-frontend
  /app
    /(auth)
      login.tsx               <-- Login Screen
    /(tabs)
      _layout.tsx             <-- Tab Bar Config
      index.tsx               <-- TAB 1: Timeline (Home)
      subjects.tsx            <-- TAB 2: Knowledge Tree
      grades.tsx              <-- TAB 3: Assessments & Grades
    /modals
      add_exam.tsx            <-- Modal: Create Assessment
      upload_syllabus.tsx     <-- Modal: PDF Picker & Preview
      complete_session.tsx    <-- Bottom Sheet: Check-off task
    _layout.tsx               <-- Root Layout (Providers)
  
  /components
    /common
      Button.tsx
      Input.tsx
      Card.tsx
    /schedule
      TimeBlock.tsx           <-- The colored agenda item
      TimelineView.tsx        <-- Wrapper for RN-Calendars
    /syllabus
      TopicTree.tsx           <-- Recursive Component
      TopicRow.tsx
    /forms
      RecursiveCheckbox.tsx   <-- Logic for selecting Module -> Topics

  /stores                     <-- Zustand Stores
    useAuthStore.ts
    useScheduleStore.ts
    useSyllabusStore.ts

  /services                   <-- API Calls
    api.ts                    <-- Axios Instance (Base URL)
    syllabusService.ts
    scheduleService.ts

  /constants
    Colors.ts                 <-- App Theme
    Types.ts                  <-- TypeScript Interfaces
```

---

## 3. TypeScript Interfaces (The Contract)

Create a `types.ts` file immediately. These must match the Backend JSON responses.

```typescript
// types.ts

export interface User {
  id: string;
  email: string;
  semester_start: string;
  semester_end: string;
}

export interface Topic {
  id: string;
  title: string;
  parent_id: string | null;
  est_minutes: number;
  current_mastery: number; // 0.0 to 1.0
  children?: Topic[];      // Recursive structure
  status: 'pending' | 'completed' | 'needs_revision';
}

export interface StudySession {
  id: string;
  topic_id: string;
  topic_title: string;     // Hydrated by backend
  subject_color: string;   // Hydrated by backend
  start_time: string;      // ISO String
  end_time: string;        // ISO String
  status: 'scheduled' | 'completed' | 'missed';
  session_type: 'learning' | 'revision';
}

export interface FixedEvent {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string; // "14:00:00"
  end_time: string;
  color_hex: string;
}
```

---

## 4. State Management (Zustand)

We will use **3 distinct stores** to keep logic clean.

### 4.1 `useScheduleStore`
Manages the Daily Timeline.
*   **State:**
    *   `selectedDate`: string (YYYY-MM-DD)
    *   `sessions`: `StudySession[]`
    *   `fixedEvents`: `FixedEvent[]`
    *   `isLoading`: boolean
*   **Actions:**
    *   `fetchAgenda(date)`: Calls API, populates `sessions` and `fixedEvents`.
    *   `markComplete(sessionId, actualMinutes)`: Optimistic update -> API Call.

### 4.2 `useSyllabusStore`
Manages the Tree of Knowledge.
*   **State:**
    *   `subjects`: Array of Subject objects (including nested topics).
*   **Actions:**
    *   `uploadPdf(fileUri)`: Uploads to backend, receives JSON, updates state.
    *   `fetchTree()`: Refreshes the full hierarchy.

### 4.3 `useUIStore`
Manages temporary UI state.
*   **State:**
    *   `isFabOpen`: boolean
    *   `activeModal`: 'exam' | 'syllabus' | null

---

## 5. Screen Specifications

### 5.1 Tab 1: The Timeline (Home)
**Path:** `app/(tabs)/index.tsx`

*   **Header:** Month/Day Selector.
*   **Body:** `<TimelineList />` (from `react-native-calendars`).
    *   **Props:**
        *   `events`: Mapped from `useScheduleStore.sessions` + `fixedEvents`.
        *   `timelineLeftInset`: 50 (Space for time labels).
    *   **Logic:**
        *   **Fixed Events:** Render with `color: '#E0E0E0'` and `locked: true`.
        *   **Study Sessions:** Render with `color: subject.color_hex`.
        *   **Interaction:** Tapping a block opens `/modals/complete_session`.
*   **Floating Action Button:** "+" Icon. Opens Action Sheet (Add Exam, Add Syllabus, Add Class).

### 5.2 Tab 2: The Knowledge Tree
**Path:** `app/(tabs)/subjects.tsx`

*   **Layout:** `FlatList`.
*   **Item Component:** `SubjectCard` (Collapsible).
*   **Inner Component:** `TopicTree`.
    *   **Recursive Logic:**
        *   If `topic.children.length > 0`, render a generic `<View>` container.
        *   Recursively render `TopicTree` for each child.
        *   Indentation: `paddingLeft: 16`.
    *   **Visuals:**
        *   Progress Bar for `current_mastery`.
        *   Icon for `status` (Checkmark, Warning Triangle for revision).

### 5.3 Modal: Add Assessment (The Complex One)
**Path:** `app/modals/add_exam.tsx`

*   **Form:**
    *   Title (Input)
    *   Date (DateTimePicker)
    *   Weightage (Slider 0-100%)
*   **The Topic Selector:**
    *   **Component:** `RecursiveCheckbox`.
    *   **Logic:**
        *   User taps a "Module" checkbox.
        *   **Action:** Auto-select ALL descendant topic IDs.
        *   **State:** Store `selectedTopicIds: string[]`.
*   **Submit:** Sends JSON to `POST /assessments`.

### 5.4 Modal: Complete Session
**Path:** `app/modals/complete_session.tsx`

*   **Type:** Bottom Sheet (or Transparent Modal).
*   **Content:**
    *   "Did you finish [Topic Name]?"
    *   **Slider:** "Time Spent" (Default: Scheduled Duration).
    *   **Toggle:** "Mark as Done" vs "I need more time".
*   **Logic:**
    *   If "More time": Show input "How much is left?".
    *   On Save: Call `PATCH /study-sessions/{id}/complete`.

---

## 6. Styling Theme (Constants)

Define these in `constants/Colors.ts` to ensure the "Keystone" aesthetic.

```typescript
export const Colors = {
  primary: '#2563EB',     // Keystone Blue (Action)
  background: '#F8FAFC',  // Slate 50
  surface: '#FFFFFF',
  text: '#0F172A',        // Slate 900
  textSecondary: '#64748B',
  
  // Status Colors
  success: '#22C55E',     // Green (Mastery)
  warning: '#F59E0B',     // Amber (Revision needed)
  urgent: '#EF4444',      // Red (Overdue/Spillover)
  fixed: '#E2E8F0',       // Grey (Fixed Events)
  
  // Topic Difficulty visualizer
  difficulty: {
    easy: '#86EFAC',
    medium: '#93C5FD',
    hard: '#FCA5A5',
  }
};
```

---

## 7. Implementation Roadmap (Frontend)

1.  **Setup:**
    *   `npx create-expo-app@latest keystone-frontend`
    *   Install: `zustand axios expo-router react-native-calendars`.
2.  **Navigation Skeleton:**
    *   Create the `(tabs)` layout.
    *   Create the empty screens.
3.  **UI Components:**
    *   Build `TopicTree` (Test with mock JSON).
    *   Build `TimelineView` (Test with mock events).
4.  **Integration:**
    *   Connect `useScheduleStore` to `TimelineView`.
    *   Implement `axios` calls to your running FastAPI backend.
