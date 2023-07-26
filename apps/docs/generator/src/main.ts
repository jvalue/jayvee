// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { writeFileSync } from 'fs';
import { join } from 'path';

import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import {
  PrimitiveValuetypes,
  getRegisteredBlockMetaInformation,
  getRegisteredConstraintMetaInformation,
  registerConstraints,
  useExtension,
} from '@jvalue/jayvee-language-server';

import { UserDocGenerator } from './user-doc-generator';

useExtension(new StdLangExtension());

function main(): void {
  const rootPath = join(__dirname, '..', '..', '..', '..');
  generateBlockTypeDocs(rootPath);
  generateConstraintTypeDocs(rootPath);
  generateValueTypeDocs(rootPath);
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
  const metaInfs = getRegisteredBlockMetaInformation();
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
  const docsPath = join(rootPath, 'apps', 'docs', 'docs', 'user');
  const userDocBuilder = new UserDocGenerator();
  const valueTypeDoc =
    userDocBuilder.generateValueTypesDoc(PrimitiveValuetypes);

  const fileName = `builtin-valuetypes.md`;
  writeFileSync(join(docsPath, fileName), valueTypeDoc, {
    flag: 'w',
  });
  console.info(`Generated file ${fileName}`);
}

main();
