# CodeLab - Browser-Based Code Playground

A modern, browser-based code editor and playground similar to CodeSandbox. Build, preview, and share code instantly in your browser.

## Features

- **Multi-Template Support**
  - Vanilla JS (HTML, CSS, JavaScript)
  - React (JavaScript)
  - React TypeScript

- **Real-Time Preview**
  - Live preview as you type
  - Instant feedback for Vanilla JS
  - Sandpack-powered React preview

- **Monaco Editor**
  - VS Code-like editing experience
  - Syntax highlighting
  - IntelliSense support
  - Multiple file tabs

- **Dependency Management**
  - Search and add npm packages
  - Auto-update package.json
  - Works with React projects

- **Project Management**
  - Create, rename, delete projects
  - Auto-save functionality
  - Organize by template type
  - Firebase cloud storage

- **Modern UI**
  - Dark theme
  - File tree explorer
  - Collapsible console
  - Responsive design

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Editor**: Monaco Editor
- **Preview**: Sandpack (React), Custom iframe (Vanilla)
- **Backend**: Firebase (Auth + Firestore)
- **UI Library**: ui_zenkit (custom)
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/codelab.git

# Navigate to project
cd codelab

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components (Dashboard, Editor)
├── store/          # Zustand stores
├── utils/          # Utility functions & templates
├── types/          # TypeScript types
└── main.tsx        # App entry point
```

## Screenshots

### Dashboard
- Project cards organized by template type
- Quick actions (rename, delete)
- Create new project modal

### Editor
- Monaco code editor
- File tree explorer
- Live preview panel
- Dependency manager
- Collapsible console

## License

MIT License

## Author

Made with love by **Sayed Abdul Karim**

---

[Live Demo](https://codelab.example.com) | [Report Bug](https://github.com/yourusername/codelab/issues)
