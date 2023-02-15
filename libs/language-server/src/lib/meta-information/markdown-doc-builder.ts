export class MarkdownDocBuilder {
  private markdownTextLines: string[] = [];

  title(title: string): MarkdownDocBuilder {
    this.markdownTextLines.push(`# ${title}`);
    return this;
  }

  blockTypeTitle(blockType: string): MarkdownDocBuilder {
    return this.title(`BlockType \`${blockType}\``);
  }

  attributeTitle(attributeName: string): MarkdownDocBuilder {
    return this.title(`Attribute \`${attributeName}\``);
  }

  description(text?: string): MarkdownDocBuilder {
    if (text === undefined) {
      return this;
    }
    return this.newSection('Description', text);
  }

  attributes(
    attributes: Array<[string, string | undefined]>,
  ): MarkdownDocBuilder {
    const content = attributes
      .map(([key, description]) => `- \`${key}\`: ${description ?? ''}`)
      .join('\n');
    return this.newSection('Attributes', content);
  }

  validation(text?: string): MarkdownDocBuilder {
    if (text === undefined) {
      return this;
    }
    return this.newSection('Validation', text);
  }

  example(text?: string): MarkdownDocBuilder {
    if (text === undefined) {
      return this;
    }
    return this.newSection('Example', '```\n' + text + '\n```');
  }

  newSection(heading: string, content: string): MarkdownDocBuilder {
    this.markdownTextLines.push(`## ${heading}`);
    this.markdownTextLines.push(content);
    return this;
  }

  newLine(): MarkdownDocBuilder {
    this.markdownTextLines.push('\n');
    return this;
  }

  build(): string {
    return this.markdownTextLines.join('\n');
  }
}
