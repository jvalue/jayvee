import { BlockMetaInformation } from '../meta-information';

import {
  JayveeBlockAttributeDocBuilder,
  JayveeBlockTypeDocBuilder,
} from './jayvee-doc-builder';
import { MarkdownBuilder } from './markdown-builder';

export class LspDocBuilder
  implements JayveeBlockTypeDocBuilder, JayveeBlockAttributeDocBuilder
{
  buildBlockTypeDoc(metaInf: BlockMetaInformation): string {
    const markdownBuilder = new MarkdownBuilder();
    return markdownBuilder.line(metaInf.docs.description).build();
  }

  buildBlockAttributeDoc(
    metaInf: BlockMetaInformation,
    attributeName: string,
  ): string | undefined {
    const markdownBuilder = new MarkdownBuilder();
    const attributeSpec = metaInf.getAttributeSpecification(attributeName);
    if (attributeSpec === undefined) {
      return undefined;
    }
    return markdownBuilder
      .line(attributeSpec.docs?.description)
      .newLine()
      .line(attributeSpec.docs?.validation)
      .build();
  }
}
