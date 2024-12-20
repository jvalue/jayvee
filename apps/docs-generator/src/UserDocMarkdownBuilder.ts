// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import {
  type ExampleDoc,
  type IOType,
  MarkdownBuilder,
  type PropertySpecification,
} from '@jvalue/jayvee-language-server';

export class UserDocMarkdownBuilder {
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

  heading(heading: string, depth = 1): UserDocMarkdownBuilder {
    this.markdownBuilder.heading(heading, depth);
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

  compatibleValueType(type: string): UserDocMarkdownBuilder {
    this.markdownBuilder.line(`Compatible value type: ${type}`);
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
