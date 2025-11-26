# Agent Guidelines for Keystone Mobile

## Build & Test Commands
- **Lint**: `bun run lint` (uses eslint-config-expo)
- **Start**: `bun start` (Expo dev server)
- **Platform-specific**: `bun run ios|android|web`
- No test framework configured yet

## Code Style

### TypeScript
- Strict mode enabled (`tsconfig.json`)
- Use `type` for props, `interface` for data models
- Explicit types for function returns

### Imports
- Use `@/` path alias for project root imports (e.g., `@/components/themed-text`)
- Group imports: React, third-party, local (with blank lines between groups)

### Components
- Named exports for components (`export function ComponentName`)
- Props types: `ComponentNameProps` suffix
- Use kebab-case for filenames (`themed-text.tsx`)

### Naming
- Components: PascalCase (`ThemedText`)
- Hooks: camelCase with `use` prefix (`useColorScheme`)
- Types: PascalCase with `Props` or `Type` suffix
- Files: kebab-case for components, camelCase for utilities

## Design System: Brutalist Monospace

### Typography
- **All text**: Monospace fonts only (`Fonts.mono` from `@/constants/theme`)
- **Hierarchy**: Use font weight (bold/regular) and size, never decorative fonts
- **Case**: Prefer UPPERCASE for headers/labels to emphasize brutalist aesthetic

### Colors
- **Palette**: High contrast, limited colors (black, white, primary accent)
- **Borders**: Thick, solid borders (2-4px) on all major UI elements
- **Shadows**: Avoid gradients and soft shadows; use hard drop shadows if needed

### Layout
- **Grid-based**: Align elements to strict grid system
- **Spacing**: Use multiples of 8px (8, 16, 24, 32)
- **Borders**: Box everything - cards, buttons, inputs should have visible borders
- **Corners**: Sharp corners (borderRadius: 0) or minimal rounding (4px max)

### Components
- **Buttons**: Rectangular, thick borders, solid fills, uppercase text
- **Cards**: Heavy borders, no elevation, stark background contrast
- **Inputs**: Outlined style only, monospace text, thick borders

## Architecture Notes
- **Framework**: Expo SDK 54 with React Native 0.81.5, React 19.1.0
- **Routing**: `expo-router` file-based navigation (tabs + modals)
- **Planned State**: Zustand (per spec.md - not yet implemented)
- **Platform**: iOS/Android/Web support via Expo

See `spec.md` for full technical specification and planned features.
