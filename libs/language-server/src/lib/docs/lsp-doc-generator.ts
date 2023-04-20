// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  ConstraintMetaInformation,
} from '../meta-information';
import { MetaInformation } from '../meta-information/meta-inf';

import {
  JayveeBlockTypeDocGenerator,
  JayveeConstraintTypeDocGenerator,
  JayveePropertyDocGenerator,
} from './jayvee-doc-generator';
import { MarkdownBuilder } from './markdown-builder';

export class LspDocGenerator
  implements
    JayveeBlockTypeDocGenerator,
    JayveeConstraintTypeDocGenerator,
    JayveePropertyDocGenerator
{
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string {
    const markdownBuilder = new MarkdownBuilder();
    return markdownBuilder.line(metaInf.docs.description).build();
  }

  generateConstraintTypeDoc(metaInf: ConstraintMetaInformation): string {
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
