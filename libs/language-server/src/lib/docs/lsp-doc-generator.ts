import { BlockMetaInformation } from '../meta-information';

import {
  JayveeBlockAttributeDocGenerator,
  JayveeBlockTypeDocGenerator,
} from './jayvee-doc-generator';
import { MarkdownBuilder } from './markdown-builder';

export class LspDocGenerator
  implements JayveeBlockTypeDocGenerator, JayveeBlockAttributeDocGenerator
{
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string {
    const markdownBuilder = new MarkdownBuilder();
    return markdownBuilder.line(metaInf.docs.description).build();
  }

  generateBlockAttributeDoc(
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
