// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type BlockTypeWrapper,
  type ExampleDoc,
  type JayveeBlockTypeDocGenerator,
  type JayveeServices,
  type JayveeValueTypesDocGenerator,
  type PrimitiveValueType,
} from '@jvalue/jayvee-language-server';

import { UserDocMarkdownBuilder } from './UserDocMarkdownBuilder';

export class UserDocGenerator
  implements JayveeBlockTypeDocGenerator, JayveeValueTypesDocGenerator
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
          valueType.getUserDoc() !== undefined,
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
