// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import {
  type JayveeServices,
  createJayveeServices,
  getAllBuiltinBlockTypes,
  getAllBuiltinConstraintTypes,
  initializeWorkspace,
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
  const blockTypes = getAllBuiltinBlockTypes(
    services.shared.workspace.LangiumDocuments,
    services.WrapperFactories,
  );

  const docsPath = join(
    rootPath,
    'apps',
    'docs',
    'docs',
    'user',
    'block-types',
  );

  for (const blockType of blockTypes) {
    const userDocBuilder = new UserDocGenerator(services);
    const blockTypeDoc = userDocBuilder.generateBlockTypeDoc(blockType);

    const fileName = `${blockType.type}.md`;
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
  const constraintTypes = getAllBuiltinConstraintTypes(
    services.shared.workspace.LangiumDocuments,
    services.WrapperFactories,
  );

  for (const constraintType of constraintTypes) {
    const userDocBuilder = new UserDocGenerator(services);
    const blockTypeDoc =
      userDocBuilder.generateConstraintTypeDoc(constraintType);

    const fileName = `${constraintType.type}.md`;
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
  const docsPath = join(
    rootPath,
    'apps',
    'docs',
    'docs',
    'user',
    'value-types',
  );
  const userDocBuilder = new UserDocGenerator(services);
  const valueTypeDoc = userDocBuilder.generateValueTypesDoc(
    services.ValueTypeProvider.Primitives.getAll(),
  );

  const fileName = `built-in-value-types.md`;
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
