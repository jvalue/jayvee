import { StdLangExtension } from '@jvalue/extensions/std/lang';
import { createJayveeServices, useExtension } from '@jvalue/language-server';
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

useExtension(new StdLangExtension());

const { shared } = createJayveeServices({ connection, ...EmptyFileSystem });

startLanguageServer(shared);
