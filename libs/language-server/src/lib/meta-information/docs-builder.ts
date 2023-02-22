import type { BlockMetaInformation, ExampleDoc } from './block-meta-inf';

export class MarkdownDocBuilder {
  private markdownTextLines: string[] = [];

  private getHeaderPrefix(depth: number): string {
    return '#'.repeat(depth);
  }

  metaData(headers: Record<string, string>): MarkdownDocBuilder {
    this.markdownTextLines.push(
      '---\n' +
        Object.entries(headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n') +
        '\n---\n',
    );
    return this;
  }

  heading(title: string, depth: number): MarkdownDocBuilder {
    this.markdownTextLines.push(`${this.getHeaderPrefix(depth)} ${title}`);
    this.newLine();
    return this;
  }

  section(heading: string, content: string, depth: number): MarkdownDocBuilder {
    this.heading(heading, depth);
    this.markdownTextLines.push(content);
    this.newLine();
    return this;
  }

  newLine(): MarkdownDocBuilder {
    this.markdownTextLines.push('\n');
    return this;
  }

  comment(comment: string): MarkdownDocBuilder {
    this.markdownTextLines.push(`<!-- ${comment} -->`);
    return this;
  }

  blockTypeTitle(blockType: string, depth = 1): MarkdownDocBuilder {
    return this.heading(`BlockType \`${blockType}\``, depth);
  }

  attributeTitle(attributeName: string, depth = 1): MarkdownDocBuilder {
    return this.heading(`Attribute \`${attributeName}\``, depth);
  }

  description(text?: string, depth = 2): MarkdownDocBuilder {
    if (text === undefined) {
      return this;
    }
    return this.section('Description', text, depth);
  }

  attributes(
    attributes: Array<[string, string | undefined]>,
    depth = 2,
  ): MarkdownDocBuilder {
    const content = attributes
      .map(([key, description]) => `- \`${key}\`: ${description ?? ''}`)
      .join('\n');
    return this.section('Attributes', content, depth);
  }

  validation(text?: string, depth = 2): MarkdownDocBuilder {
    if (text === undefined) {
      return this;
    }
    return this.section('Validation', text, depth);
  }

  examples(examples?: ExampleDoc[], depth = 2): MarkdownDocBuilder {
    if (examples === undefined) {
      return this;
    }
    for (const [index, example] of examples.entries()) {
      const exampleText =
        '```\n' + example.code + '\n```\n' + example.description;
      this.section(`Example ${index + 1}`, exampleText, depth);
    }
    return this;
  }

  build(): string {
    return this.markdownTextLines.join('\n');
  }
}

export function buildLspBlockTypeDoc(metaInf: BlockMetaInformation): string {
  return new MarkdownDocBuilder()
    .blockTypeTitle(metaInf.blockType)
    .description(metaInf.docs.description)
    .attributes(
      Object.entries(metaInf.getAttributeSpecifications()).map(
        ([key, spec]) => [key, spec.docs?.description],
      ),
    )
    .examples(metaInf.docs.examples)
    .build();
}

export function buildLspBlockAttributeDoc(
  metaInf: BlockMetaInformation,
  attributeName: string,
): string | undefined {
  const attributes = metaInf.getAttributeSpecifications();
  const attribute = attributes[attributeName];
  if (attribute === undefined || attribute.docs === undefined) {
    return undefined;
  }

  return new MarkdownDocBuilder()
    .attributeTitle(attributeName)
    .description(attribute.docs.description)
    .validation(attribute.docs.validation)
    .examples(attribute.docs.examples)
    .build();
}
