// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { createJayveeServices, useExtension } from '@jvalue/jayvee-language-server';
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
