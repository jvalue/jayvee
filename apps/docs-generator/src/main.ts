import { writeFileSync } from 'fs';
import { join } from 'path';

import { StdLangExtension } from '@jayvee/extensions/std/lang';
import {
  BlockMetaInformation,
  MarkdownDocBuilder,
  getOrFailMetaInformation,
  getRegisteredBlockTypes,
  useExtension,
} from '@jayvee/language-server';

useExtension(new StdLangExtension());

function createMarkdownDoc(metaInf: BlockMetaInformation): string {
  const metaTitle = `---
title: ${metaInf.blockType}
---`;
  return (
    metaTitle +
    new MarkdownDocBuilder()
      .blockTypeTitle(metaInf.blockType)
      .description(metaInf.docs.description)
      .attributes(
        Object.entries(metaInf.getAttributeSpecifications()).map(
          ([key, spec]) => [key, spec.docs?.description],
        ),
      )
      .examples(metaInf.docs.examples)
      .build()
  );
}

const blockNames = getRegisteredBlockTypes();
for (const blockName of blockNames) {
  const metaInf = getOrFailMetaInformation(blockName);
  const markdown = createMarkdownDoc(metaInf);

  const fileName = `${blockName}.md`;
  writeFileSync(
    join(
      __dirname,
      '..',
      '..',
      '..',
      'apps',
      'docs',
      'docs',
      'block-types',
      fileName,
    ),
    markdown,
    {
      flag: 'w',
    },
  );
  console.info(`Generated file ${fileName}`);
}
