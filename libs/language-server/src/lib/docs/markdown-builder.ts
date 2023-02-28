export class MarkdownBuilder {
  protected markdownTextLines: string[] = [];

  private getHeaderPrefix(depth: number): string {
    return '#'.repeat(depth);
  }

  heading(title: string, depth: number): MarkdownBuilder {
    this.markdownTextLines.push(`${this.getHeaderPrefix(depth)} ${title}`);
    return this;
  }

  line(text?: string): MarkdownBuilder {
    if (text !== undefined) {
      this.markdownTextLines.push(text);
    }
    return this;
  }

  code(code: string, language?: string) {
    return this.line('```' + (language ?? ''))
      .line(code)
      .line('```');
  }

  newLine(): MarkdownBuilder {
    this.markdownTextLines.push('\n');
    return this;
  }

  comment(comment: string): MarkdownBuilder {
    this.markdownTextLines.push(`<!-- ${comment} -->`);
    return this;
  }

  build(): string {
    return this.markdownTextLines.join('\n');
  }
}
