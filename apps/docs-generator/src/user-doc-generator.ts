// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  type BlockTypeWrapper,
  type ConstraintTypeWrapper,
  type ExampleDoc,
  type IOType,
  type JayveeBlockTypeDocGenerator,
  type JayveeConstraintTypeDocGenerator,
  type JayveeServices,
  type JayveeValueTypesDocGenerator,
  MarkdownBuilder,
  type PrimitiveValueType,
  type PropertySpecification,
} from '@jvalue/jayvee-language-server';

export class UserDocGenerator
  implements
    JayveeBlockTypeDocGenerator,
    JayveeConstraintTypeDocGenerator,
    JayveeValueTypesDocGenerator
{
  constructor(private services: JayveeServices) {}

  generateValueTypesDoc(valueTypes: PrimitiveValueType[]): string {
    const builder = new UserDocMarkdownBuilder()
      .docTitle('Built-in Value Types')
      .generationComment()
      .description(
        `
For an introduction to _value types_, see the [core concepts](../core-concepts).
_Built-in value types_ come with the basic version of Jayvee.
They are the basis for more restricted [_primitive value types_](./primitive-value-types)
that fullfil [_constraints_](./primitive-value-types#constraints).`.trim(),
        1,
      )
      .heading('Available built-in value types', 1);

    valueTypes
      .filter((valueType) => valueType.isReferenceableByUser())
      .forEach((valueType) => {
        assert(
          valueType.getUserDoc(),
          `Documentation is missing for user extendable value type: ${valueType.getName()}`,
        );
        builder
          .heading(valueType.getName(), 2)
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

  generateBlockTypeDoc(blockType: BlockTypeWrapper): string {
    const documentationService =
      this.services.documentation.DocumentationProvider;
    const blocktypeDocs = documentationService.getDocumentation(
      blockType.astNode,
    );
    const blocktypeDocsFromComments =
      this.extractDocsFromComment(blocktypeDocs);

    const builder = new UserDocMarkdownBuilder()
      .docTitle(blockType.type)
      .generationComment()
      .ioTypes(blockType.inputType, blockType.outputType)
      .description(blocktypeDocsFromComments?.description)
      .examples(blocktypeDocsFromComments?.examples);

    builder.propertiesHeading();
    Object.entries(blockType.getPropertySpecifications()).forEach(
      ([key, property]) => {
        const blocktypeProperty = blockType.astNode.properties.filter(
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

  generateConstraintTypeDoc(constraintType: ConstraintTypeWrapper): string {
    const documentationService =
      this.services.documentation.DocumentationProvider;
    const blocktypeDocs = documentationService.getDocumentation(
      constraintType.astNode,
    );
    const constraintTypeDocsFromComments =
      this.extractDocsFromComment(blocktypeDocs);

    const builder = new UserDocMarkdownBuilder()
      .docTitle(constraintType.type)
      .generationComment()
      .compatibleValueType(constraintType.on.getName())
      .description(constraintTypeDocsFromComments?.description)
      .examples(constraintTypeDocsFromComments?.examples);

    builder.propertiesHeading();
    Object.entries(constraintType.getPropertySpecifications()).forEach(
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
    /*
    Format:

    <description>
    *@example*
    <example description>
    <example code>
    */

    const commentSections = comment
      .split('*@example*')
      .map((section) => section.trim());
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
