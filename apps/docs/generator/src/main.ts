// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import {
  BlockMetaInformation,
  PrimitiveValuetypes,
  getRegisteredConstraintMetaInformation,
  registerConstraints,
} from '@jvalue/jayvee-language-server';

import { UserDocGenerator } from './user-doc-generator';

function main(): void {
  const rootPath = join(__dirname, '..', '..', '..', '..');
  generateBlockTypeDocs(rootPath);
  generateConstraintTypeDocs(rootPath);
  generateValueTypeDocs(rootPath);
  generateExampleDocs(rootPath);
}

function generateBlockTypeDocs(rootPath: string): void {
  const docsPath = join(
    rootPath,
    'apps',
    'docs',
    'docs',
    'user',
    'block-types',
  );
  const metaInfs: BlockMetaInformation[] = []; // TODO: load from Std Lib
  for (const metaInf of metaInfs) {
    const userDocBuilder = new UserDocGenerator();
    const blockTypeDoc = userDocBuilder.generateBlockTypeDoc(metaInf);

    const fileName = `${metaInf.type}.md`;
    writeFileSync(join(docsPath, fileName), blockTypeDoc, {
      flag: 'w',
    });
    console.info(`Generated file ${fileName}`);
  }
}

function generateConstraintTypeDocs(rootPath: string): void {
  const docsPath = join(
    rootPath,
    'apps',
    'docs',
    'docs',
    'user',
    'constraint-types',
  );
  registerConstraints();
  const metaInfs = getRegisteredConstraintMetaInformation();

  for (const metaInf of metaInfs) {
    const userDocBuilder = new UserDocGenerator();
    const blockTypeDoc = userDocBuilder.generateConstraintTypeDoc(metaInf);

    const fileName = `${metaInf.type}.md`;
    writeFileSync(join(docsPath, fileName), blockTypeDoc, {
      flag: 'w',
    });
    console.info(`Generated file ${fileName}`);
  }
}

function generateValueTypeDocs(rootPath: string): void {
  const docsPath = join(rootPath, 'apps', 'docs', 'docs', 'user', 'valuetypes');
  const userDocBuilder = new UserDocGenerator();
  const valueTypeDoc =
    userDocBuilder.generateValueTypesDoc(PrimitiveValuetypes);

  const fileName = `builtin-valuetypes.md`;
  writeFileSync(join(docsPath, fileName), valueTypeDoc, {
    flag: 'w',
  });
  console.info(`Generated file ${fileName}`);
}

function generateExampleDocs(rootPath: string): void {
  const docsPath = join(rootPath, 'apps', 'docs', 'docs', 'user', 'examples');
  const examplesPath = join(rootPath, 'example');

  for (const file of readdirSync(examplesPath)) {
    if (file.endsWith('.jv')) {
      const exampleFilePath = join(examplesPath, file);
      const exampleModel = readFileSync(exampleFilePath);

      const exampleName = file.slice(0, -'.jv'.length);
      const docFileName = `${exampleName}.md`;
      const docContent = `
---
title: ${exampleName}
---

\`\`\`jayvee
${exampleModel.toString()}
\`\`\`
      `.trim();
      writeFileSync(join(docsPath, docFileName), docContent, {
        flag: 'w',
      });
      console.info(`Generated example doc ${docFileName}`);
    }
  }
}

main();
