// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/*
  The necessary imports for the Monaco editor can be found here:
  https://github.com/TypeFox/monaco-languageclient/blob/c5511b19e95e237c3f95a0fc0588769263f3ba40/packages/examples/browser-lsp/src/client.ts
*/

import 'monaco-editor/esm/vs/editor/editor.all.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickInput/standaloneQuickInputService.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js';
import {
  CloseAction,
  type Disposable,
  ErrorAction,
  type MessageTransports,
  MonacoLanguageClient,
  MonacoServices,
  State,
} from 'monaco-languageclient';
import React from 'react';
import getMessageServiceOverride from 'vscode/service-override/messages';
import { StandaloneServices } from 'vscode/services';
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from 'vscode-languageserver-protocol/browser.js';

import JayveeMonarchConfig from './jayvee.monarch';

const LANGUAGE_NAME = 'jayvee';

export interface MonacoEditorProps {
  startJayveeWorker: () => Worker;

  /**
   * The text that shall (initially) be displayed in the editor.
   *
   * Whenever this Prop changes, the internal Model is re-created.
   * This is a pretty expensive operation.
   * Thus, you should only change this Prop when absolutely necessary.
   * Most importantly: Since the editor holds its own state, you should **not** sync `editorText` with your State.
   * Or, in other words: Do not update this Prop whenever {@link onDidChangeEditorText} is called.
   * In most applications, it is sufficient to set this Prop once (when the component gets created) and then to just leave it unchanged.
   */
  editorText: string;
  onDidChangeEditorText: (newText: string) => void;

  /**
   * Settings that will be passed to the constructor of the Monaco editor.
   * These settings can be used to control the appearance of the editor.
   *
   * For instance, you can set the color theme of the editor using the following configuration:
   *
   * ``` ts
   * {
   *  theme: 'vs-dark'
   * }
   * ```
   *
   * A good starting point for experimenting with the editor options is the Monaco Playground, see
   * https://microsoft.github.io/monaco-editor/playground.html
   *
   * **You should memoize this Prop, because whenever it changes, the editor model gets re-created.**
   */
  editorConfig?: monaco.editor.IStandaloneEditorConstructionOptions;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {
  return (
    <MonacoContext {...props}>
      <MonacoWrapper {...props} />
    </MonacoContext>
  );
};

const MonacoWrapper: React.FC<MonacoEditorProps> = (props) => {
  const [state, setState] = React.useState<{
    model: monaco.editor.ITextModel | undefined;
  }>({
    model: undefined,
  });

  React.useEffect(() => {
    // For some reason, creating the model too quickly leads to a runtime error saying `Cannot read properties of undefined (reading 'onDidChangeNotification')`. Thus, we create the model "on-the-fly" here.
    const model = monaco.editor.createModel(props.editorText, LANGUAGE_NAME);

    setState((state) => ({ ...state, model: model }));

    return () => {
      model.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the `editorText` Prop changes, update the model.
  React.useEffect(() => {
    if (!state.model) {
      return;
    }

    state.model.setValue(props.editorText);
  }, [props.editorText, state.model]);

  React.useEffect(() => {
    if (!state.model) {
      return;
    }

    // When the model content (i.e. the text in the editor) changes, call the callback function defined in Props.
    state.model.onDidChangeContent(() => {
      if (!state.model) {
        return;
      }
      props.onDidChangeEditorText(state.model.getValue());
    });
  }, [props, state.model]);

  React.useEffect(() => {
    if (!state.model) {
      return;
    }

    const defaultEditorConfig: monaco.editor.IStandaloneEditorConstructionOptions =
      {
        model: state.model,
        theme: 'vs-light',

        // Make sure that the editor is automatically resized when the container is resized.
        automaticLayout: true,
      };
    const editorConfig = { ...defaultEditorConfig, ...props.editorConfig };

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const editor = monaco.editor.create(containerRef.current!, editorConfig);

    return () => {
      editor.dispose();
    };
  }, [props.editorConfig, state.model]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  return <div ref={containerRef} style={{ height: '100%' }}></div>;
};

interface MonacoContextProps extends MonacoEditorProps {
  children: React.ReactNode;
}
const MonacoContext: React.FC<MonacoContextProps> = (props) => {
  React.useLayoutEffect(() => {
    const destroy = setUpMonaco(props.startJayveeWorker);

    return () => {
      destroy();
    };
  }, [props.startJayveeWorker]);

  return <React.Fragment>{props.children}</React.Fragment>;
};

function setUpMonaco(startJayveeWorker: () => Worker): () => void {
  const disposables: Disposable[] = [];

  window.MonacoEnvironment = {};
  window.MonacoEnvironment.getWorker = (workerId): Worker => {
    if (workerId !== 'workerMain.js') {
      throw Error('Tried to load a worker with an unknown ID.');
    }

    const worker = new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
      {
        type: 'module',
      },
    );
    return worker;
  };

  monaco.languages.register({
    id: LANGUAGE_NAME,
  });
  const tokensProvider = monaco.languages.setMonarchTokensProvider(
    LANGUAGE_NAME,
    JayveeMonarchConfig,
  );
  disposables.push(tokensProvider);

  const installedServices = MonacoServices.install() as Disposable;
  disposables.push(installedServices);

  StandaloneServices.initialize({
    ...getMessageServiceOverride(),
  });

  const worker = startJayveeWorker();
  const reader = new BrowserMessageReader(worker);
  const writer = new BrowserMessageWriter(worker);

  const languageClient = new MonacoLanguageClient({
    name: 'Jayvee Language Client',
    clientOptions: {
      documentSelector: [{ language: LANGUAGE_NAME }],
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.DoNotRestart }),
      },
    },
    connectionProvider: {
      get: (): Promise<MessageTransports> => {
        return Promise.resolve({ reader, writer });
      },
    },
  });

  void languageClient.start();

  return () => {
    for (const disposable of disposables) {
      disposable.dispose();
    }

    void pollToStopLanguageClient(languageClient, worker);
  };
}

async function pollToStopLanguageClient(
  languageClient: MonacoLanguageClient,
  worker: Worker,
  attemptsLeft = 5,
): Promise<void> {
  if (attemptsLeft < 1) {
    console.warn('Failed to stop the language client.');
    return;
  }

  if (languageClient.state === State.Running) {
    await languageClient.dispose();
    worker.terminate();
    return;
  }

  const WAIT_MILLISECONDS = 1000;
  window.setTimeout(() => {
    void pollToStopLanguageClient(languageClient, worker, attemptsLeft - 1);
  }, WAIT_MILLISECONDS);
}
