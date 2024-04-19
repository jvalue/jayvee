// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BlockTypeWrapper,
  type ConstraintTypeWrapper,
  type TypedObjectWrapper,
} from '../ast/index.js';

import {
  type JayveeBlockTypeDocGenerator,
  type JayveeConstraintTypeDocGenerator,
  type JayveePropertyDocGenerator,
} from './jayvee-doc-generator.js';
import { MarkdownBuilder } from './markdown-builder.js';

export class LspDocGenerator
  implements
    JayveeBlockTypeDocGenerator,
    JayveeConstraintTypeDocGenerator,
    JayveePropertyDocGenerator
{
  generateBlockTypeDoc(blockType: BlockTypeWrapper): string {
    const markdownBuilder = new MarkdownBuilder();
    return markdownBuilder.line(blockType.docs.description).build();
  }

  generateConstraintTypeDoc(constraintType: ConstraintTypeWrapper): string {
    const markdownBuilder = new MarkdownBuilder();
    return markdownBuilder.line(constraintType.docs.description).build();
  }

  generatePropertyDoc(
    wrapper: TypedObjectWrapper,
    propertyName: string,
  ): string | undefined {
    const markdownBuilder = new MarkdownBuilder();
    const propertySpec = wrapper.getPropertySpecification(propertyName);
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
