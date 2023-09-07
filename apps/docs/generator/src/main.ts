// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import {
  BlockMetaInformation,
  JayveeServices,
  PrimitiveValuetypes,
  createJayveeServices,
  getRegisteredConstraintMetaInformation,
  initializeWorkspace,
  isJayveeModel,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

import { UserDocGenerator } from './user-doc-generator';

async function main(): Promise<void> {
  const rootPath = join(__dirname, '..', '..', '..', '..');

  const services = createJayveeServices(NodeFileSystem).Jayvee;
  await initializeWorkspace(services);

  generateBlockTypeDocs(services, rootPath);
  generateConstraintTypeDocs(services, rootPath);
  generateValueTypeDocs(services, rootPath);
  generateExampleDocs(rootPath);
}

function generateBlockTypeDocs(
  services: JayveeServices,
  rootPath: string,
): void {
  const documentService = services.shared.workspace.LangiumDocuments;

  const metaInfs: BlockMetaInformation[] = [];
  documentService.all
    .map((document) => document.parseResult.value)
    .forEach((parsedDocument) => {
      if (!isJayveeModel(parsedDocument)) {
        throw new Error('Expected parsed document to be a JayveeModel');
      }
      parsedDocument.blocktypes.forEach((blocktypeDefinition) => {
        if (BlockMetaInformation.canBeWrapped(blocktypeDefinition)) {
          metaInfs.push(new BlockMetaInformation(blocktypeDefinition));
        }
      });
    });

  const docsPath = join(
    rootPath,
    'apps',
    'docs',
    'docs',
    'user',
    'block-types',
  );

  for (const metaInf of metaInfs) {
    const userDocBuilder = new UserDocGenerator(services);
    const blockTypeDoc = userDocBuilder.generateBlockTypeDoc(metaInf);

    const fileName = `${metaInf.type}.md`;
    writeFileSync(join(docsPath, fileName), blockTypeDoc, {
      flag: 'w',
    });
    console.info(`Generated file ${fileName}`);
  }
}

function generateConstraintTypeDocs(
  services: JayveeServices,
  rootPath: string,
): void {
  const docsPath = join(
    rootPath,
    'apps',
    'docs',
    'docs',
    'user',
    'constraint-types',
  );
  const metaInfs = getRegisteredConstraintMetaInformation();

  for (const metaInf of metaInfs) {
    const userDocBuilder = new UserDocGenerator(services);
    const blockTypeDoc = userDocBuilder.generateConstraintTypeDoc(metaInf);

    const fileName = `${metaInf.type}.md`;
    writeFileSync(join(docsPath, fileName), blockTypeDoc, {
      flag: 'w',
    });
    console.info(`Generated file ${fileName}`);
  }
}

function generateValueTypeDocs(
  services: JayveeServices,
  rootPath: string,
): void {
  const docsPath = join(rootPath, 'apps', 'docs', 'docs', 'user', 'valuetypes');
  const userDocBuilder = new UserDocGenerator(services);
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

main()
  .then(() => console.log('Finished generating docs!'))
  .catch((e) => console.error(e));
