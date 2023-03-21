import { BlockMetaInformation } from '../meta-information';
import { MetaInformation } from '../meta-information/meta-inf';

import {
  JayveeBlockTypeDocGenerator,
  JayveePropertyDocGenerator,
} from './jayvee-doc-generator';
import { MarkdownBuilder } from './markdown-builder';

export class LspDocGenerator
  implements JayveeBlockTypeDocGenerator, JayveePropertyDocGenerator
{
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string {
    const markdownBuilder = new MarkdownBuilder();
    return markdownBuilder.line(metaInf.docs.description).build();
  }

  generatePropertyDoc(
    metaInf: MetaInformation,
    propertyName: string,
  ): string | undefined {
    const markdownBuilder = new MarkdownBuilder();
    const propertySpec = metaInf.getPropertySpecification(propertyName);
    if (propertySpec === undefined) {
      return undefined;
    }
    return markdownBuilder
      .line(propertySpec.docs?.description)
      .newLine()
      .line(propertySpec.docs?.validation)
      .build();
  }
}
