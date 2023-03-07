import {
  AttributeSpecification,
  BlockMetaInformation,
  ExampleDoc,
  IOType,
  JayveeBlockTypeDocGenerator,
  MarkdownBuilder,
} from '@jvalue/language-server';

export class UserDocGenerator implements JayveeBlockTypeDocGenerator {
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string {
    const builder = new UserDocMarkdownBuilder()
      .blockTypeHeading(metaInf.blockType)
      .generationComment()
      .ioTypes(metaInf.inputType, metaInf.outputType)
      .description(metaInf.docs.description)
      .examples(metaInf.docs.examples);

    builder.attributesHeading();
    Object.entries(metaInf.getAttributeSpecifications()).forEach(
      ([key, attribute]) => {
        builder
          .attributeHeading(key, 3)
          .attributeSpec(attribute)
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

  attributeHeading(attributeName: string, depth = 1): UserDocMarkdownBuilder {
    this.markdownBuilder.heading(`\`${attributeName}\``, depth);
    return this;
  }

  attributeSpec(attributeSpec: AttributeSpecification): UserDocMarkdownBuilder {
    this.markdownBuilder.line(`Type \`${attributeSpec.type}\``);
    if (attributeSpec.defaultValue !== undefined) {
      this.markdownBuilder
        .newLine()
        .line(`Default: \`${JSON.stringify(attributeSpec.defaultValue)}\``);
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

  description(text?: string, depth = 2): UserDocMarkdownBuilder {
    if (text === undefined) {
      return this;
    }
    this.markdownBuilder.heading('Description', depth).line(text).newLine();
    return this;
  }

  attributesHeading(): UserDocMarkdownBuilder {
    this.markdownBuilder.heading('Attributes', 2);
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
        .code(example.code)
        .line(example.description)
        .newLine();
    }
    return this;
  }

  build(): string {
    return this.markdownBuilder.build();
  }
}
