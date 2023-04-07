<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# @jvalue/monaco-editor

This library contains a React component that will spawn an instance of the Monaco Editor. This instance can only be used to edit Jayvee language files.

## How to use the component

Install both the monaco editor and the language server via `npm`:

```bash
npm install @jvalue/monaco-editor @jvalue/language-server-web-worker
```

Enable Web Workers in your React project as the language server will run in its own Web Worker.
Open `tsconfig.json` and add "WebWorker" to the lib array:

```diff
{
  "compilerOptions": {
-    "lib": ["dom", "dom.iterable", "esnext"],
+    "lib": ["dom", "dom.iterable", "esnext", "WebWorker"],
  }
}
```

The following sample code spawns an instance of the monaco editor and runs the corresponding 
language server in a separate Web Worker:

```tsx
import { MonacoEditor } from '@jvalue/jayvee-monaco';
import React from 'react';

function startJayveeWorker(): Worker {
  const worker = new Worker(
    // TODO adjust the path / URL to the language server:
    new URL('<path-to-language-server-web-worker>/main.js', import.meta.url), {
      type: 'module',
  });
  return worker;
}
export const EditorExample: React.FC = () => {
  return (
    <div style={{ height: '500px' }}>
      <MonacoEditor
        startJayveeWorker={startJayveeWorker}
        editorText={'Add example code here'}
        onDidChangeEditorText={(newText): void => console.log(newText)}
      />
    </div>
  );
};
```

In case you bundle your React app with webpack, you are able to use a hard-coded relative path to the `main.js` file
included in `@jvalue/language-server-web-worker`.
Such a path looks like `../../node_modules/@jvalue/language-server-web-worker/main.js` but probably needs 
slight adjustments, so it navigates to the desired file location.

Alternatively, you can host the `main.js` file of `@jvalue/language-server-web-worker` and make it available under a 
certain URL.
Then, you can use that URL for instantiating the Web Worker instead of the previously mentioned file path.

## Development set-up

> The following guide explains how to install this component without relying on a npm registry or the like. This is particularly useful to manually test the component locally before publishing it.

### Prerequisites

We expect the component to be used in a (default) Create-React-App project. This project should ideally be created outside of the directory where the Jayvee repository is stored.

### Build the language server Web Worker

The [`language-server-web-worker`](../../apps/language-server-web-worker) project provides a ready-to-use language server to be run in a Web 
Worker.
It is required by the monaco editor in order to provide features like autocompletion and code diagnostics.
Build the project using

```bash
npx nx build language-server-web-worker
```

This creates a file `main.js` in the folder `<jayvee project root>/dist/apps/language-server-web-worker` which is
required in a later step.

### Building and packing the monaco editor

To build and pack the monaco editor, navigate to the project root folder and run

```bash
npx nx pack @jvalue/monaco-editor
```

Now, in the directory `<jayvee project
root>/dist/libs/monaco-editor`, you will find a file named `monaco-editor-<version>.tgz`
with `<version>` being the version of the monaco editor package.

We want to be able to use the package in another project. To make the package behave as if it was directly pulled 
from a registry, we first want to pack it. To do this, run `npm pack` in the directory `<jayvee project 
root>/dist/libs/monaco-editor`.

Now, you will find a file named `jvalue-monaco-editor-<version>.tgz` in that directory, 
with `<version>` being the version of the monaco editor package.

### Installation of the monaco editor

We want to be able to use the package in the React project as if it was directly pulled
from a registry. To achieve that, switch to the React project where you want to test the editor. Open `package.json` 
and add the following dependency:

```
  "dependencies": {
    "@jvalue/jayvee-monaco": "file:../../../jayvee/dist/libs/monaco-editor/jvalue-monaco-editor-0.0.0.tgz"
  },
```

You might have to adjust the paths to the files (and especially the version at the end).

Now, run `npm install`.

> Tip: Whenever you create a new version of the packages using `npm pack`, you have to install them again. This sometimes results in errors regarding the package integrity, because the two packages will contain new content, leading to a new hash. A fairly easy way to deal with this is to uninstall the two packages (i.e. to remove them from the dependencies and to call `npm install`), and then to re-install them. If you need to do this frequently, you could also symlink the packages directly, but this might require you to install the peer dependencies manually. Another important point: CreateReactApp seems to cache the build output a bit too aggressively in some cases. After installing a new version of the package, you might need to delete `node_modules/.cache/`.

### Enable Web Workers

Furthermore, we need to enable Web Workers in the React project. Open `tsconfig.json` and add "WebWorker" to the 
lib array:

```diff

{
  "compilerOptions": {
-    "lib": ["dom", "dom.iterable", "esnext"],
+    "lib": ["dom", "dom.iterable", "esnext", "WebWorker"],
  }
}

```

### Create the actual editor

Now, create a new file `my-editor.tsx` where the actual editor will be contained. Add the following file content:

```tsx
import { MonacoEditor } from '@jvalue/jayvee-monaco';
import React from 'react';

const exampleCode = 'Add example code here';

function startJayveeWorker(): Worker {
  // TODO adjust the path to the language server:
  const worker = new Worker(new URL('<jayvee project root>/dist/apps/language-server-web-worker/main.js', import.meta.
      url), {
    type: 'module',
  });

  return worker;
}
export const EditorExample: React.FC = () => {
  return (
    <div style={{ height: '500px' }}>
      <MonacoEditor
        startJayveeWorker={startJayveeWorker}
        editorText={exampleCode}
        onDidChangeEditorText={(newText): void => console.log(newText)}
      />
    </div>
  );
};
```

> Make sure to adjust the path of the URL so it refers to the `main.js` file of the built language server 
> created earlier.

That's it! You can now use the editor in your React project.

#### Source Maps warnings

When compiling your React project, you might get a large number of Webpack warnings, saying that Source Maps from `vscode-languageserver` cannot be parsed. It is not clear why this is happening. Maybe, this is related to https://github.com/microsoft/vscode-languageserver-node/issues/879 and https://github.com/microsoft/vscode-languageserver-node/pull/908 (even though these issues seem to be resolved).

## Development notes

### Webpack URLs

When using `new URL('something')`, Webpack uses static analysis to bundle the referenced item. So this is not just 
runtime code - it is used during compilation. It was mentioned somewhere in the long discussion here:
https://github.com/webpack/webpack/discussions/13655#discussioncomment-937300. Also refer to the corresponding [webpack documentation](https://webpack.js.org/guides/web-workers/).

### Resources

The following resources were pretty useful when building the component:

- https://github.com/eclipse-theia/theia/wiki/LSP-and-Monaco-Integration
- https://github.com/TypeFox/monaco-languageclient (includes an example regarding the in-browser LSP, see https://github.com/TypeFox/monaco-languageclient/blob/c5511b19e95e237c3f95a0fc0588769263f3ba40/packages/examples/browser-lsp/src)
