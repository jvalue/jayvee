import { writeFileSync } from 'fs';
import { join } from 'path';

import { StdLangExtension } from '@jvalue/extensions/std/lang';
import {
  getRegisteredBlockMetaInformation,
  useExtension,
} from '@jvalue/language-server';

import { UserDocGenerator } from './user-doc-generator';

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

main();
