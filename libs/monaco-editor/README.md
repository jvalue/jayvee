# @jayvee/monaco-editor

This library contains a React component that will spawn an instance of the Monaco Editor. This instance can only be used to edit Jayvee language files.

## Development set-up

> The following guide explains how to install this component without relying on a npm registry or the like. This is particularly useful to manually test the component locally before publishing it.

### Prerequisites

We expect the component to be used in a (default) Create-React-App project. This project should ideally be created outside of the directory where the Jayvee repository is stored.

### Building

In the Jayvee project, run

```
npx nx build @jayvee/monaco-editor
```

This will build both the monaco editor and the language server. You can find the output in `<jayvee project root>/dist/libs/`.

We want to be able to use the two packages in another project. To make the packages behave as if they were directly pulled from a registry, we first want to pack them. To do this, run `npm pack` in the following two directories:

- `<jayvee project root>/dist/libs/language-server`
- `<jayvee project root>/dist/libs/monaco-editor`

Now, you will find a file named `jayvee-language-server-<version>.tgz` in `<jayvee project root>/dist/libs/language-server`, with `<version>` being the version of the package. A similar file can be found at the monaco editor package.

### Install

Now, switch to the React project where you want to test the editor. Open `package.json` and add the following to the dependencies:

```
  "dependencies": {
    "@jayvee/language-server": "file:../../../jayvee/dist/libs/language-server/jvalue-language-server-0.0.0.tgz",
    "@jvalue/language-server": "file:../../../jayvee/dist/libs/language-server/jvalue-language-server-0.0.0.tgz",
    "@jvalue/monaco-editor": "file:../../../jayvee/dist/libs/monaco-editor/jvalue-monaco-editor-0.0.0.tgz"
  },
```

You might have to adjust the paths to the files (and especially the version at the end). Please note that we are both importing "@jayvee/language-server" and "@jvalue/language-server". This is done because on our registry, the package scope gets changed from "@jayvee" to "@jvalue", and the monaco-editor package has a peer dependency that renames from @jayvee/language-server to @jvalue/language-server.

Now, run `npm install`.

> Tip: Whenever you create a new version of the packages using `npm pack`, you have to install them again. This sometimes results in errors regarding the package integrity, because the two packages will contain new content, leading to a new hash. A fairly easy way to deal with this is to uninstall the two packages (i.e. to remove them from the dependencies and to call `npm install`), and then to re-install them. If you need to do this frequently, you could also symlink the packages directly, but this might require you to install the peer dependencies manually. Another important point: CreateReactApp seems to cache the build output a bit too aggressively in some cases. After installing a new version of the package, you might need to delete `node_modules/.cache/`.

### Usage

To use the component, we need to perform a few additional steps.

#### Create the WebWorker

First, we need to create the file that will power the WebWorker running the Jayvee Language Server. For this, create a file called `server-worker.ts`. Add the following content to this file:

```ts
import { createJayveeServices } from '@jvalue/language-server';
import { EmptyFileSystem, startLanguageServer } from 'langium';
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
} from 'vscode-languageserver/browser.js';

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared } = createJayveeServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);
```

Got an error saying "Cannot find name 'DedicatedWorkerGlobalScope'"? Then open your `tsconfig.json` and add "WebWorker" to the lib array:

```diff

{
  "compilerOptions": {
-    "lib": ["dom", "dom.iterable", "esnext"],
+    "lib": ["dom", "dom.iterable", "esnext", "WebWorker"],
  }
}

```

#### Create the actual editor

Now, create a new file `my-editor.tsx` where the actual editor will be contained. This file should be created next to `server-worker.ts`. Add the following file content:

```tsx
import { MonacoEditor } from '@jvalue/monaco-editor';
import React from 'react';

const exampleCode = 'Add example code here';

function startJayveeWorker(): Worker {
  const worker = new Worker(new URL('./server-worker.ts', import.meta.url), {
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

> Of course, you can name the Worker file differently and place it in a different folder. In this case, make sure to adjust the path used in `startJayveeWorker()`.

That's it! You can now use the editor in your React project.

#### Source Maps warnings

When compiling your React project, you might get a large number of Webpack warnings, saying that Source Maps from `vscode-languageserver` cannot be parsed. It is not clear why this is happening. Maybe, this is related to https://github.com/microsoft/vscode-languageserver-node/issues/879 and https://github.com/microsoft/vscode-languageserver-node/pull/908 (even though these issues seem to be resolved).

## Development notes

### Webpack URLs

When using `new URL('something')`, Webpack seems to use static analysis to bundle the referenced item. So this is not just runtime code - it is used during compilation. It was mentioned somewhere in the long discussion here: https://github.com/webpack/webpack/discussions/13655#discussioncomment-937300

### Resources

The following resources were pretty useful when building the component:

- https://github.com/eclipse-theia/theia/wiki/LSP-and-Monaco-Integration
- https://github.com/TypeFox/monaco-languageclient (includes an example regarding the in-browser LSP, see https://github.com/TypeFox/monaco-languageclient/blob/c5511b19e95e237c3f95a0fc0588769263f3ba40/packages/examples/browser-lsp/src)
