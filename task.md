# CodeLab - Task List

## Project Overview
Browser-based code playground (like CodeSandbox) for HTML/CSS/JS and React.
Uses ZenkitUI (own component library) + zenkit-css (own CSS framework).

---

## Phase 0: Prerequisites (ZenkitUI Deployment)

### 0.1 ZenkitUI Publish
- [ ] Review @zenkit-ui/core package.json (version, exports)
- [ ] Build @zenkit-ui/core (`pnpm build`)
- [ ] Build @zenkit-ui/hooks (`pnpm build`)
- [ ] Test build output locally
- [ ] Publish @zenkit-ui/core to npm
- [ ] Publish @zenkit-ui/hooks to npm
- [ ] Verify installation works (`npm install @zenkit-ui/core`)

### 0.2 ZenkitUI Storybook Deploy (Optional but recommended)
- [ ] Build storybook (`pnpm build-storybook`)
- [ ] Deploy to Vercel/Netlify (for documentation reference)

---

## Phase 1: Project Setup

### 1.1 Initialize CodeLab
- [ ] Create Vite + React + TypeScript project
- [ ] Install dependencies:
  - zenkit-css
  - @zenkit-ui/core
  - @zenkit-ui/hooks
  - zustand
  - react-router-dom
  - @monaco-editor/react
  - @codesandbox/sandpack-react
  - firebase
  - algoliasearch
- [ ] Setup folder structure
- [ ] Configure TypeScript paths
- [ ] Setup zenkit-css in main.css

### 1.2 Firebase Setup
- [ ] Create Firebase project (console.firebase.google.com)
- [ ] Enable Google Authentication
- [ ] Create Firestore database
- [ ] Setup security rules
- [ ] Get Firebase config keys
- [ ] Create firebase.ts config file

---

## Phase 2: Authentication

### 2.1 Auth Implementation
- [ ] Create AuthContext/AuthStore (Zustand)
- [ ] Google Sign-in button component
- [ ] Sign-out functionality
- [ ] Auth state persistence
- [ ] Protected routes setup
- [ ] User profile storage in Firestore

---

## Phase 3: Dashboard

### 3.1 Dashboard Layout
- [ ] Main dashboard layout using AppShell
- [ ] Sidebar navigation (Recent, All Projects, Settings)
- [ ] Header with user avatar, logout

### 3.2 Project Cards
- [ ] Project card component
- [ ] Fetch projects from Firestore (where userId == current user)
- [ ] Display project grid
- [ ] Empty state when no projects

### 3.3 New Project Flow
- [ ] "Create New" button
- [ ] Template selection modal:
  - Vanilla (HTML/CSS/JS)
  - React
- [ ] Project name input
- [ ] Create project in Firestore
- [ ] Navigate to editor

---

## Phase 4: Editor Layout

### 4.1 Editor Shell
- [ ] Three-panel layout (File Explorer | Editor | Preview)
- [ ] Resizable panels using Splitter
- [ ] Header with project name, save status

### 4.2 File Explorer
- [ ] Tree component for file structure
- [ ] File icons (JS, CSS, HTML, JSON)
- [ ] Click to open file in editor
- [ ] Right-click context menu (rename, delete)
- [ ] Create new file/folder

### 4.3 Code Editor
- [ ] Monaco Editor integration
- [ ] Tab bar for open files
- [ ] Syntax highlighting (JS, JSX, CSS, HTML, JSON)
- [ ] Auto-save to local state

### 4.4 Live Preview
- [ ] Sandpack preview integration
- [ ] Hot reload on code change
- [ ] Error overlay
- [ ] Refresh button

---

## Phase 5: Dependencies

### 5.1 Dependency Panel
- [ ] Dependency section in sidebar
- [ ] Search input with Algolia npm search
- [ ] Search results dropdown
- [ ] Click to install (add to dependencies)
- [ ] Display installed dependencies
- [ ] Remove dependency option

### 5.2 Sandpack Integration
- [ ] Pass dependencies to Sandpack
- [ ] Handle dependency installation loading state

---

## Phase 6: Project Persistence

### 6.1 Auto-Save
- [ ] Debounced save to Firestore on code change
- [ ] Save indicator (Saving... / Saved)
- [ ] Save files + dependencies

### 6.2 Load Project
- [ ] Fetch project by ID from URL
- [ ] Load files into editor
- [ ] Load dependencies into Sandpack
- [ ] Handle project not found

---

## Phase 7: Polish

### 7.1 UI Enhancements
- [ ] Dark theme (default)
- [ ] Loading skeletons
- [ ] Toast notifications
- [ ] Keyboard shortcuts (Cmd+S save, etc.)

### 7.2 Templates
- [ ] Vanilla starter files
- [ ] React starter files
- [ ] Template preview in selection modal

### 7.3 Error Handling
- [ ] Firebase error handling
- [ ] Sandpack error boundaries
- [ ] Network error states

---

## Phase 8: Future (Next.js Support - Requires Infra)

- [ ] Research VM/Container options
- [ ] Backend server setup
- [ ] Next.js template
- [ ] Server-side execution

---

## Components to Check/Add in ZenkitUI

During development, if any component is missing:

| Needed | ZenkitUI Status | Action |
|--------|-----------------|--------|
| FileTree | Tree exists | Check file icon support |
| SearchInput | Input exists | May need variant |
| PanelGroup | Splitter exists | Verify API |
| EmptyState | Empty exists | Check styling |

---

## Notes

- Always use ZenkitUI components first
- If component missing, add to ZenkitUI, publish, then use
- Keep zenkit-css updated if new styles needed
- Test on Chrome, Firefox, Safari
