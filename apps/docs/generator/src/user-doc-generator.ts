// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  ConstraintMetaInformation,
  ExampleDoc,
  IOType,
  JayveeBlockTypeDocGenerator,
  JayveeConstraintTypeDocGenerator,
  MarkdownBuilder,
  PropertySpecification,
} from '@jvalue/jayvee-language-server';

export class UserDocGenerator
  implements JayveeBlockTypeDocGenerator, JayveeConstraintTypeDocGenerator
{
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string {
    const builder = new UserDocMarkdownBuilder()
      .docTitle(metaInf.type)
      .generationComment()
      .ioTypes(metaInf.inputType, metaInf.outputType)
      .description(metaInf.docs.description)
      .examples(metaInf.docs.examples);

    builder.propertiesHeading();
    Object.entries(metaInf.getPropertySpecifications()).forEach(
      ([key, property]) => {
        builder
          .propertyHeading(key, 3)
          .propertySpec(property)
          .description(property.docs?.description, 4)
          .validation(property.docs?.validation, 4)
          .examples(property.docs?.examples, 4);
      },
    );

    return builder.build();
  }

  generateConstraintTypeDoc(metaInf: ConstraintMetaInformation): string {
    const builder = new UserDocMarkdownBuilder()
      .docTitle(metaInf.type)
      .generationComment()
      .compatibleValueTypes(metaInf.compatiblePrimitiveValuetypes)
      .description(metaInf.docs.description)
      .examples(metaInf.docs.examples);

    builder.propertiesHeading();
    Object.entries(metaInf.getPropertySpecifications()).forEach(
      ([key, property]) => {
        builder
          .propertyHeading(key, 3)
          .propertySpec(property)
          .description(property.docs?.description, 4)
          .validation(property.docs?.validation, 4)
          .examples(property.docs?.examples, 4);
      },
    );

    return builder.build();
  }
}

class UserDocMarkdownBuilder {
  private markdownBuilder = new MarkdownBuilder();

  docTitle(blockType: string): UserDocMarkdownBuilder {
    this.markdownBuilder
      .line('---')
      .line(`title: ${blockType}`)
      .line('---')
      .newLine();
    return this;
  }

  generationComment(): UserDocMarkdownBuilder {
    this.markdownBuilder
      .comment(
        'Do NOT change this document as it is auto-generated from the language server',
      )
      .newLine();
    return this;
  }

  propertyHeading(propertyName: string, depth = 1): UserDocMarkdownBuilder {
    this.markdownBuilder.heading(`\`${propertyName}\``, depth);
    return this;
  }

  propertySpec(propertySpec: PropertySpecification): UserDocMarkdownBuilder {
    this.markdownBuilder.line(`Type \`${propertySpec.type.getName()}\``);
    if (propertySpec.defaultValue !== undefined) {
      this.markdownBuilder
        .newLine()
        .line(`Default: \`${JSON.stringify(propertySpec.defaultValue)}\``);
    }
    this.markdownBuilder.newLine();
    return this;
  }

  ioTypes(inputType: IOType, outputType: IOType): UserDocMarkdownBuilder {
    this.markdownBuilder
      .line(`Input type: \`${inputType}\``)
      .newLine()
      .line(`Output type: \`${outputType}\``)
      .newLine();
    return this;
  }

  compatibleValueTypes(types: string[]): UserDocMarkdownBuilder {
    this.markdownBuilder.line(`Compatible ValueTypes:`);
    this.markdownBuilder.line(types.map((type) => `\`${type}\``).join(', '));
    this.markdownBuilder.newLine();
    return this;
  }

  description(text?: string, depth = 2): UserDocMarkdownBuilder {
    if (text === undefined) {
      return this;
    }
    this.markdownBuilder.heading('Description', depth).line(text).newLine();
    return this;
  }

  propertiesHeading(): UserDocMarkdownBuilder {
    this.markdownBuilder.heading('Properties', 2);
    return this;
  }

  validation(text?: string, depth = 2): UserDocMarkdownBuilder {
    if (text === undefined) {
      return this;
    }
    this.markdownBuilder.heading('Validation', depth).line(text).newLine();
    return this;
  }

  examples(examples?: ExampleDoc[], depth = 2): UserDocMarkdownBuilder {
    if (examples === undefined) {
      return this;
    }
    for (const [index, example] of examples.entries()) {
      this.markdownBuilder
        .heading(`Example ${index + 1}`, depth)
        .code(example.code, 'jayvee')
        .line(example.description)
        .newLine();
    }
    return this;
  }

  build(): string {
    return this.markdownBuilder.build();
  }
}
