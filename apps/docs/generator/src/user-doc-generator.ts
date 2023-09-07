// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockMetaInformation,
  ConstraintMetaInformation,
  ExampleDoc,
  IOType,
  JayveeBlockTypeDocGenerator,
  JayveeConstraintTypeDocGenerator,
  JayveeServices,
  JayveeValueTypesDocGenerator,
  MarkdownBuilder,
  PrimitiveValuetype,
  PropertySpecification,
} from '@jvalue/jayvee-language-server';

export class UserDocGenerator
  implements
    JayveeBlockTypeDocGenerator,
    JayveeConstraintTypeDocGenerator,
    JayveeValueTypesDocGenerator
{
  constructor(private services: JayveeServices) {}

  generateValueTypesDoc(valueTypes: {
    [name: string]: PrimitiveValuetype;
  }): string {
    const builder = new UserDocMarkdownBuilder()
      .docTitle('Built-in Valuetypes')
      .generationComment()
      .description(
        `
For an introduction to valuetypes, see the [Core Concepts](../core-concepts).
Built-in valuetypes come with the basic version of Jayvee.
They are the basis for more restricted [Primitive Valuetypes](./primitive-valuetypes)
that fullfil [Constraints](./primitive-valuetypes#constraints).`.trim(),
        1,
      )
      .heading('Available built-in valuetypes', 1);

    Object.entries(valueTypes)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, valueType]) => valueType.isReferenceableByUser())
      .forEach(([name, valueType]) => {
        assert(
          valueType.getUserDoc(),
          `Documentation is missing for user extendable value type: ${valueType.getName()}`,
        );
        builder
          .heading(name, 2)
          .description(valueType.getUserDoc() ?? '', 3)
          .examples(
            [
              {
                code: `
block ExampleTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "columnName" oftype ${valueType.getName()}
  ];
}`.trim(),
                description: `A block of type \`TableInterpreter\` that
              interprets data in the column \`columnName\` as \`${valueType.getName()}\`.
              `.trim(),
              },
            ],
            3,
          );
      });

    return builder.build();
  }

  generateBlockTypeDoc(metaInf: BlockMetaInformation): string {
    const documentationService =
      this.services.documentation.DocumentationProvider;
    const blocktypeDocs = documentationService.getDocumentation(
      metaInf.wrapped,
    );
    const blocktypeDocsFromComments =
      this.extractDocsFromComment(blocktypeDocs);

    const builder = new UserDocMarkdownBuilder()
      .docTitle(metaInf.type)
      .generationComment()
      .ioTypes(metaInf.inputType, metaInf.outputType)
      .description(blocktypeDocsFromComments?.description)
      .examples(blocktypeDocsFromComments?.examples);

    builder.propertiesHeading();
    Object.entries(metaInf.getPropertySpecifications()).forEach(
      ([key, property]) => {
        const blocktypeProperty = metaInf.wrapped.properties.filter(
          (p) => p.name === key,
        )[0];
        if (blocktypeProperty === undefined) {
          return;
        }

        const propertyDocs =
          documentationService.getDocumentation(blocktypeProperty);
        const propDocsFromComments = this.extractDocsFromComment(propertyDocs);

        builder
          .propertyHeading(key, 3)
          .propertySpec(property)
          .description(propDocsFromComments?.description, 4)
          .validation(property.docs?.validation, 4)
          .examples(propDocsFromComments?.examples, 4);
      },
    );

    return builder.build();
  }

  generateConstraintTypeDoc(metaInf: ConstraintMetaInformation): string {
    const builder = new UserDocMarkdownBuilder()
      .docTitle(metaInf.type)
      .generationComment()
      .compatibleValueType(metaInf.compatibleValuetype.getName())
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

  private extractDocsFromComment(comment?: string | undefined):
    | {
        description: string | undefined;
        examples: ExampleDoc[];
      }
    | undefined {
    if (comment === undefined) {
      return undefined;
    }
    const commentSections = comment.split('@example').map((t) => t.trim());
    const examples = commentSections.slice(1).map((x) => {
      const exampleLines = x.split('\n');
      return {
        description: exampleLines[0] ?? '',
        code: exampleLines.slice(1).join('\n'),
      };
    });

    return {
      description: commentSections[0],
      examples: examples,
    };
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
    this.markdownBuilder.line(`Compatible ValueType: ${type}`);
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
