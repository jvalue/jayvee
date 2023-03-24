// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

export class MarkdownBuilder {
  protected markdownTextLines: string[] = [];

  private getHeaderPrefix(depth: number): string {
    return '#'.repeat(depth);
  }

  heading(title: string, depth: number): MarkdownBuilder {
    this.markdownTextLines.push(`${this.getHeaderPrefix(depth)} ${title}`);
    this.newLine();
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
      .line('```')
      .newLine();
  }

  newLine(): MarkdownBuilder {
    this.markdownTextLines.push('');
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
