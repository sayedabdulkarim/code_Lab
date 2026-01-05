# CodeLab - Task List

## Project Overview
Browser-based code playground (like CodeSandbox) for HTML/CSS/JS and React.
Uses ZenkitUI (own component library) + zenkit-css (own CSS framework).

---

## Phase 0: Prerequisites (ZenkitUI Deployment)

### 0.1 ZenkitUI Publish
- [x] Review @zenkit-ui/core package.json (version, exports)
- [x] Build @zenkit-ui/core (`pnpm build`)
- [x] Build @zenkit-ui/hooks (`pnpm build`)
- [x] Test build output locally
- [x] Publish @zenkit-ui/core to npm (published as ui_zenkit)
- [ ] Publish @zenkit-ui/hooks to npm
- [x] Verify installation works (`npm install ui_zenkit`)

### 0.2 ZenkitUI Storybook Deploy (Optional but recommended)
- [x] Build storybook (`pnpm build-storybook`)
- [x] Deploy to GitHub Pages (https://sayedabdulkarim.github.io/-zenkit-ui/)

---

## Phase 1: Project Setup

### 1.1 Initialize CodeLab
- [x] Create Vite + React + TypeScript project
- [x] Install dependencies:
  - zenkit-css
  - ui_zenkit (was @zenkit-ui/core)
  - zustand
  - react-router-dom
  - @monaco-editor/react
  - @codesandbox/sandpack-react
  - firebase
  - algoliasearch
- [x] Setup folder structure
- [x] Configure TypeScript paths
- [x] Setup zenkit-css in index.css

### 1.2 Firebase Setup
- [x] Create firebase.ts config file
- [ ] Create Firebase project (console.firebase.google.com)
- [ ] Enable Google Authentication
- [ ] Create Firestore database
- [ ] Setup security rules
- [ ] Get Firebase config keys

---

## Phase 2: Authentication

### 2.1 Auth Implementation
- [x] Create AuthContext/AuthStore (Zustand)
- [x] Google Sign-in button component
- [x] GitHub Sign-in button component
- [x] Sign-out functionality
- [x] Auth state persistence
- [x] Protected routes setup
- [x] User profile storage in Firestore

---

## Phase 3: Dashboard

### 3.1 Dashboard Layout
- [x] Main dashboard layout using AppShell
- [x] Sidebar navigation (Recent, All Projects, Settings)
- [x] Header with user avatar, logout

### 3.2 Project Cards
- [x] Project card component
- [x] Fetch projects from Firestore (where userId == current user)
- [x] Display project grid
- [x] Empty state when no projects

### 3.3 New Project Flow
- [x] "Create New" button
- [x] Template selection modal:
  - Vanilla (HTML/CSS/JS)
  - React
  - React TypeScript
  - Vue
  - Angular
  - Svelte
  - Next.js
- [x] Project name input
- [x] Create project in Firestore
- [x] Navigate to editor

---

## Phase 4: Editor Layout

### 4.1 Editor Shell
- [x] Three-panel layout (File Explorer | Editor | Preview)
- [x] Resizable panels using Splitter
- [x] Header with project name, save status

### 4.2 File Explorer
- [x] File list with icons (JS, CSS, HTML, JSON, etc.)
- [x] Click to open file in editor
- [x] Tree component for nested file structure
- [x] Right-click context menu (rename, delete)
- [x] Create new file/folder

### 4.3 Code Editor
- [x] Monaco Editor integration
- [x] Tab bar for open files
- [x] Syntax highlighting (JS, JSX, CSS, HTML, JSON)
- [x] Auto-save to local state
- [x] Unsaved indicator on tabs

### 4.4 Live Preview
- [x] Sandpack preview integration
- [x] Hot reload on code change
- [x] Console toggle
- [x] Refresh button

---

## Phase 5: Dependencies

### 5.1 Dependency Panel
- [x] Dependency section in sidebar
- [x] Search input with npm registry search
- [x] Search results dropdown
- [x] Click to install (add to dependencies)
- [x] Display installed dependencies
- [x] Remove dependency option

### 5.2 Sandpack Integration
- [x] Pass dependencies to Sandpack
- [x] Handle dependency installation loading state

---

## Phase 6: Project Persistence

### 6.1 Auto-Save
- [x] Debounced save to Firestore on code change (2 second delay)
- [x] Save indicator (Saving... / Saved / Unsaved)
- [x] Save files + dependencies
- [x] Keyboard shortcut (Cmd/Ctrl + S)

### 6.2 Load Project
- [x] Fetch project by ID from URL
- [x] Load files into editor
- [x] Load dependencies into Sandpack
- [x] Handle project not found

---

## Phase 7: Polish

### 7.1 UI Enhancements
- [x] Dark theme (default)
- [x] Loading skeletons
- [x] Toast notifications
- [x] Keyboard shortcuts (Cmd+S save)

### 7.2 Templates
- [x] Vanilla starter files
- [x] React starter files
- [x] React TypeScript starter files
- [x] Vue starter files
- [x] Angular starter files
- [x] Svelte starter files
- [x] Next.js starter files
- [ ] Template preview in selection modal

### 7.3 Error Handling
- [x] Firebase error handling (basic)
- [x] Sandpack error boundaries
- [x] Network error states

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
| PanelGroup | Splitter exists | ✅ Working |
| EmptyState | Empty exists | ✅ Working |
| AppShell | AppShell exists | ✅ Working |
| Sidebar | Sidebar exists | ✅ Working |
| Avatar | Avatar exists | ✅ Working |

---

## Notes

- Always use ZenkitUI components first
- If component missing, add to ZenkitUI, publish, then use
- Keep zenkit-css updated if new styles needed
- Test on Chrome, Firefox, Safari
