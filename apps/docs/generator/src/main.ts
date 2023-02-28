import { writeFileSync } from 'fs';
import { join } from 'path';

import { StdLangExtension } from '@jayvee/extensions/std/lang';
import {
  getRegisteredMetaInformation,
  useExtension,
} from '@jayvee/language-server';

import { UserDocBuilder } from './user-doc-builder';

useExtension(new StdLangExtension());

function main(): void {
  const rootPath = join(__dirname, '..', '..', '..', '..');
  const docsPath = join(
    rootPath,
    'apps',
    'docs',
    'docs',
    'user',
    'block-types',
  );
  const metaInfs = getRegisteredMetaInformation();
  for (const metaInf of metaInfs) {
    const userDocBuilder = new UserDocBuilder();
    const blockTypeDoc = userDocBuilder.buildBlockTypeDoc(metaInf);

    const fileName = `${metaInf.blockType}.md`;
    writeFileSync(join(docsPath, fileName), blockTypeDoc, {
      flag: 'w',
    });
    console.info(`Generated file ${fileName}`);
  }
}

main();
