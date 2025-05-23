// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  type JayveeServices,
  createJayveeServices,
  getAllReferenceableBlockTypes,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import { NodeFileSystem } from 'langium/node';

import { UserDocGenerator } from './user-doc-generator';
import { UserDocCategoryBuilder } from './UserDocCategoryBuilder';
import { getBlockTypeDomain } from './util';

/** ESM does not know __filename and __dirname, so defined here */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  const docsAppPath = join(__dirname, '..', '..', '..', 'apps', 'docs');
  const jayveeExamplesPath = join(__dirname, '..', '..', '..', 'example');

  const services = createJayveeServices(NodeFileSystem).Jayvee;
  await initializeWorkspace(services);

  generateBlockTypeDocs(services, docsAppPath);
  generateValueTypeDocs(services, docsAppPath);
  generateExampleDocs(jayveeExamplesPath, docsAppPath);
}

function generateBlockTypeDocs(
  services: JayveeServices,
  docsAppPath: string,
): void {
  const blockTypes = getAllReferenceableBlockTypes(
    services.shared.workspace.LangiumDocuments,
    services.WrapperFactories,
  );
  const docsPath = join(docsAppPath, 'docs', 'user', 'block-types');

  const domainsGenerated: string[] = [];

  const userCategoryBuilder = new UserDocCategoryBuilder();
  userCategoryBuilder.generateDocsCategory(
    docsPath,
    'builtin',
    'Built-in Blocks',
    0,
    `Built-in Blocks.`,
  );

  for (const blockType of blockTypes) {
    const blockDomain = getBlockTypeDomain(blockType);
    if (blockDomain !== undefined) {
      if (!domainsGenerated.includes(blockDomain)) {
        const userCategoryBuilder = new UserDocCategoryBuilder();
        userCategoryBuilder.generateDocsCategory(
          docsPath,
          blockDomain,
          `Domain extension: ${blockDomain}`,
          domainsGenerated.length + 1,
          `Blocks from the ${blockDomain} domain extension.`,
        );
        domainsGenerated.push(blockDomain);
      }
    }
    const userDocBuilder = new UserDocGenerator(services);
    const blockTypeDoc = userDocBuilder.generateBlockTypeDoc(blockType);

    const fileName = `${blockType.type}.md`;
    writeFileSync(
      join(docsPath, blockDomain ?? 'builtin', fileName),
      blockTypeDoc,
      {
        flag: 'w',
      },
    );
    console.info(`Generated file ${fileName}`);
  }
}

function generateValueTypeDocs(
  services: JayveeServices,
  docsAppPath: string,
): void {
  const docsPath = join(docsAppPath, 'docs', 'user', 'value-types');
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

function generateExampleDocs(examplesPath: string, docsAppPath: string): void {
  const docsPath = join(docsAppPath, 'docs', 'user', 'examples');

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
