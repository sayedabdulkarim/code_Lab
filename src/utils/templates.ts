import type { ProjectFile, ProjectTemplate, TemplateConfig } from '../types';

export const templates: Record<ProjectTemplate, TemplateConfig> = {
  vanilla: {
    name: 'Vanilla',
    icon: 'javascript',
    description: 'HTML, CSS & JavaScript',
    files: {
      '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Project</title>
    <link rel="stylesheet" href="src/styles.css" />
  </head>
  <body>
    <div id="app">
      <h1>Hello CodeLab!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
    <script src="src/index.js"></script>
  </body>
</html>`,
      '/src/index.js': `// JavaScript code here
const app = document.getElementById('app');

console.log('Hello from JavaScript!');

// You can modify the DOM
// app.innerHTML = '<h1>Modified!</h1>';`,
      '/src/styles.css': `* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 20px;
  background: #1a1a1a;
  color: white;
  min-height: 100vh;
}

#app {
  text-align: center;
}

h1 {
  color: #f7df1e;
}`,
      '/package.json': `{
  "name": "html-css-js",
  "version": "1.0.0",
  "description": "",
  "main": "index.html",
  "scripts": {
    "start": "parcel index.html --open",
    "build": "parcel build index.html"
  },
  "dependencies": {},
  "devDependencies": {
    "@babel/core": "7.2.0",
    "parcel-bundler": "^1.6.1"
  },
  "keywords": []
}`,
    },
  },
  react: {
    name: 'React',
    icon: 'react',
    description: 'React with JavaScript',
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
    },
    files: {
      '/src/App.js': `export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeLab!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  );
}`,
      '/src/index.js': `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      '/src/styles.css': `* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 20px;
  background: #282c34;
  color: white;
  min-height: 100vh;
}

.App {
  text-align: center;
}

h1 {
  color: #61dafb;
}`,
      '/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      '/package.json': `{
  "name": "react-app",
  "version": "1.0.0",
  "main": "/src/index.js",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`,
    },
  },
  'react-ts': {
    name: 'React TypeScript',
    icon: 'react',
    description: 'React with TypeScript',
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
    },
    devDependencies: {
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
    },
    files: {
      '/src/App.tsx': `export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeLab!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  );
}`,
      '/src/index.tsx': `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      '/src/styles.css': `* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 20px;
  background: #282c34;
  color: white;
  min-height: 100vh;
}

.App {
  text-align: center;
}

h1 {
  color: #61dafb;
}`,
      '/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React TypeScript App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      '/package.json': `{
  "name": "react-ts-app",
  "version": "1.0.0",
  "main": "/src/index.tsx",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}`,
      '/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}`,
    },
  },
};

export const getTemplateFiles = (template: ProjectTemplate): ProjectFile[] => {
  const config = templates[template];
  return Object.entries(config.files).map(([path, content]) => ({
    path,
    content,
    language: getLanguageFromPath(path),
  }));
};

const getLanguageFromPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascriptreact',
    ts: 'typescript',
    tsx: 'typescriptreact',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
  };
  return languageMap[ext || ''] || 'plaintext';
};

export const getTemplateList = () => {
  return Object.entries(templates).map(([key, config]) => ({
    id: key as ProjectTemplate,
    ...config,
  }));
};

export const getTemplateDependencies = (template: ProjectTemplate): Record<string, string> => {
  const config = templates[template];
  return config.dependencies || {};
};
