import {
  BlockMetaInformation,
  ExampleDoc,
  JayveeBlockTypeDocBuilder,
  MarkdownBuilder,
} from '@jayvee/language-server';

export class UserDocGenerator implements JayveeBlockTypeDocBuilder {
  buildBlockTypeDoc(metaInf: BlockMetaInformation): string {
    const builder = new UserDocMarkdownBuilder()
      .blockTypeHeading(metaInf.blockType)
      .generationComment()
      .description(metaInf.docs.description)
      .attributes(
        Object.entries(metaInf.getAttributeSpecifications()).map(
          ([key, spec]) => [key, spec.docs?.description],
        ),
      )
      .examples(metaInf.docs.examples);

    builder.attributeDetailsHeading();
    Object.entries(metaInf.getAttributeSpecifications()).forEach(
      ([key, attribute]) => {
        builder
          .attributeHeading(key, 3)
          .description(attribute.docs?.description, 4)
          .validation(attribute.docs?.validation, 4)
          .examples(attribute.docs?.examples, 4);
      },
    );

    return builder.build();
  }
}

class UserDocMarkdownBuilder {
  private markdownBuilder = new MarkdownBuilder();

  blockTypeHeading(blockType: string): UserDocMarkdownBuilder {
    this.markdownBuilder.line('---').line(`title: ${blockType}`).line('---');
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

  attributeHeading(attributeName: string, depth = 1): UserDocMarkdownBuilder {
    this.markdownBuilder.heading(`Attribute \`${attributeName}\``, depth);
    return this;
  }

  description(text?: string, depth = 2): UserDocMarkdownBuilder {
    if (text === undefined) {
      return this;
    }
    this.markdownBuilder.heading('Description', depth).line(text);
    return this;
  }

  attributeDetailsHeading(): UserDocMarkdownBuilder {
    this.markdownBuilder.heading('Attribute Details', 2);
    return this;
  }

  attributes(
    attributes: Array<[string, string | undefined]>,
    depth = 2,
  ): UserDocMarkdownBuilder {
    const content = attributes
      .map(([key, description]) => `- \`${key}\`: ${description ?? ''}`)
      .join('\n');
    this.markdownBuilder.heading('Attributes', depth).line(content);
    return this;
  }

  validation(text?: string, depth = 2): UserDocMarkdownBuilder {
    if (text === undefined) {
      return this;
    }
    this.markdownBuilder.heading('Validation', depth).line(text);
    return this;
  }

  examples(examples?: ExampleDoc[], depth = 2): UserDocMarkdownBuilder {
    if (examples === undefined) {
      return this;
    }
    for (const [index, example] of examples.entries()) {
      this.markdownBuilder
        .heading(`Example ${index + 1}`, depth)
        .code(example.code)
        .line(example.description);
    }
    return this;
  }

  build(): string {
    return this.markdownBuilder.build();
  }
}
