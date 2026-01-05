import type { ProjectFile, ProjectTemplate, TemplateConfig } from '../types';

export const templates: Record<ProjectTemplate, TemplateConfig> = {
  react: {
    name: 'React',
    icon: 'react',
    description: 'React with JavaScript',
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
    },
    files: {
      '/App.js': `export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeLab!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  );
}`,
      '/index.js': `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      '/styles.css': `* {
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
      '/App.tsx': `export default function App(): JSX.Element {
  return (
    <div className="App">
      <h1>Hello CodeLab!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  );
}`,
      '/index.tsx': `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
      '/styles.css': `* {
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
    },
  },
  vanilla: {
    name: 'Vanilla JS',
    icon: 'javascript',
    description: 'Plain JavaScript',
    files: {
      '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla JS</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="app">
      <h1>Hello CodeLab!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
    <script src="/index.js"></script>
  </body>
</html>`,
      '/index.js': `document.getElementById('app').innerHTML = \`
  <h1>Hello CodeLab!</h1>
  <p>Start editing to see some magic happen!</p>
\`;

console.log('Hello from JavaScript!');`,
      '/styles.css': `* {
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
    },
  },
  'vanilla-ts': {
    name: 'Vanilla TypeScript',
    icon: 'typescript',
    description: 'Plain TypeScript',
    files: {
      '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla TypeScript</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/index.ts"></script>
  </body>
</html>`,
      '/index.ts': `const app = document.getElementById('app') as HTMLElement;

interface AppState {
  message: string;
}

const state: AppState = {
  message: 'Hello CodeLab!'
};

app.innerHTML = \`
  <h1>\${state.message}</h1>
  <p>Start editing to see some magic happen!</p>
\`;

console.log('Hello from TypeScript!');`,
      '/styles.css': `* {
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
  color: #3178c6;
}`,
    },
  },
  vue: {
    name: 'Vue',
    icon: 'vue',
    description: 'Vue.js 3',
    files: {
      '/src/App.vue': `<template>
  <div class="app">
    <h1>Hello CodeLab!</h1>
    <p>Start editing to see some magic happen!</p>
  </div>
</template>

<script setup>
// Your Vue logic here
</script>

<style scoped>
.app {
  text-align: center;
}

h1 {
  color: #42b883;
}
</style>`,
      '/src/main.js': `import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

createApp(App).mount('#app')`,
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
}`,
      '/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue App</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`,
    },
  },
  angular: {
    name: 'Angular',
    icon: 'angular',
    description: 'Angular',
    files: {
      '/src/app/app.component.ts': `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="app">
      <h1>Hello CodeLab!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  \`,
  styles: [\`
    .app {
      text-align: center;
    }
    h1 {
      color: #dd0031;
    }
  \`]
})
export class AppComponent {
  title = 'CodeLab';
}`,
      '/src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent);`,
      '/src/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Angular App</title>
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>`,
    },
  },
  svelte: {
    name: 'Svelte',
    icon: 'svelte',
    description: 'Svelte',
    files: {
      '/App.svelte': `<script>
  let name = 'CodeLab';
</script>

<main>
  <h1>Hello {name}!</h1>
  <p>Start editing to see some magic happen!</p>
</main>

<style>
  main {
    text-align: center;
  }
  h1 {
    color: #ff3e00;
  }
</style>`,
      '/index.js': `import App from './App.svelte';

const app = new App({
  target: document.body
});

export default app;`,
    },
  },
  nextjs: {
    name: 'Next.js',
    icon: 'nextjs',
    description: 'Next.js React Framework',
    files: {
      '/pages/index.js': `export default function Home() {
  return (
    <div className="container">
      <h1>Hello CodeLab!</h1>
      <p>Start editing to see some magic happen!</p>
    </div>
  );
}`,
      '/styles/globals.css': `* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 20px;
  background: #000;
  color: white;
  min-height: 100vh;
}

.container {
  text-align: center;
}

h1 {
  color: #0070f3;
}`,
      '/pages/_app.js': `import '../styles/globals.css';

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
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
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    vue: 'vue',
    svelte: 'svelte',
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
