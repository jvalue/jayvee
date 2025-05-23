// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type BlockTypeWrapper, type TypedObjectWrapper } from '../ast';

import {
  type JayveeBlockTypeDocGenerator,
  type JayveePropertyDocGenerator,
} from './jayvee-doc-generator';
import { MarkdownBuilder } from './markdown-builder';

export class LspDocGenerator
  implements JayveeBlockTypeDocGenerator, JayveePropertyDocGenerator
{
  generateBlockTypeDoc(blockType: BlockTypeWrapper): string {
    const markdownBuilder = new MarkdownBuilder();
    return markdownBuilder.line(blockType.docs.description).build();
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
