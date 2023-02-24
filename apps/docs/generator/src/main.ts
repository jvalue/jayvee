import { writeFileSync } from 'fs';
import { join } from 'path';

import { StdLangExtension } from '@jayvee/extensions/std/lang';
import {
  BlockMetaInformation,
  MarkdownDocBuilder,
  getRegisteredMetaInformation,
  useExtension,
} from '@jayvee/language-server';

useExtension(new StdLangExtension());

function createMarkdownDoc(metaInf: BlockMetaInformation): string {
  const builder = new MarkdownDocBuilder()
    .metaData({ title: metaInf.blockType })
    .comment(
      'Do NOT change this document as it is auto-generated from the language server',
    )
    .newLine()
    .description(metaInf.docs.description)
    .attributes(
      Object.entries(metaInf.getAttributeSpecifications()).map(
        ([key, spec]) => [key, spec.docs?.description],
      ),
    )
    .examples(metaInf.docs.examples);

  builder.heading('Attribute Details', 2);
  Object.entries(metaInf.getAttributeSpecifications()).forEach(
    ([key, attribute]) => {
      builder
        .attributeTitle(key, 3)
        .description(attribute.docs?.description, 4)
        .validation(attribute.docs?.validation, 4)
        .examples(attribute.docs?.examples, 4);
    },
  );

  return builder.build();
}

function main(docsDirName: string): void {
  const rootPath = join(__dirname, '..', '..', '..', '..');
  const docsPath = join(rootPath, 'apps', 'docs', 'docs', 'user', docsDirName);
  const metaInfs = getRegisteredMetaInformation();
  for (const metaInf of metaInfs) {
    const markdown = createMarkdownDoc(metaInf);

    const fileName = `${metaInf.blockType}.md`;
    writeFileSync(join(docsPath, fileName), markdown, {
      flag: 'w',
    });
    console.info(`Generated file ${fileName}`);
  }
}

main('block-types');
