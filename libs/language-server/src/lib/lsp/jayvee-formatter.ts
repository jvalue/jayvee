// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type CstNode, isCompositeCstNode } from 'langium';
import {
  AbstractFormatter,
  Formatting,
  type FormattingAction,
  type FormattingContext,
} from 'langium/lsp';
import { type Range, type TextEdit } from 'vscode-languageserver-protocol';

import {
  isBlockTypePipeline,
  isCellRangeLiteral,
  isPipeDefinition,
} from '../ast/generated/ast';

export class JayveeFormatter extends AbstractFormatter {
  protected override format(node: AstNode) {
    const formatter = this.getNodeFormatter(node);
    this.formatParenthesis(node, '{', '}');
    this.formatParenthesis(node, '[', ']');

    formatter.keywords(',', ':', ';').prepend(Formatting.noSpace());
    formatter.keywords(':').append(Formatting.oneSpace());
    formatter
      .keywords('builtin', 'property', 'requires')
      .append(Formatting.oneSpace());

    formatter
      .keywords('blocktype', 'composite', 'input', 'output')
      .append(Formatting.oneSpace());

    formatter.keywords('block').append(Formatting.oneSpace());
    formatter
      .keywords('constraint', 'constrainttype')
      .append(Formatting.oneSpace());
    formatter.keywords('oftype').surround(Formatting.oneSpace());
    formatter.keywords('on').surround(Formatting.oneSpace());

    formatter.keywords('iotype').append(Formatting.oneSpace());
    formatter.keywords('valuetype').append(Formatting.oneSpace());
    formatter.keywords('constraints').append(Formatting.noSpace());
    formatter
      .keywords('<', '>')
      .append(Formatting.noSpace())
      .prepend(Formatting.noSpace());

    formatter.keywords('transform', 'from', 'to').append(Formatting.oneSpace());

    formatter
      .keywords('cell', 'column', 'row', 'range')
      .surround(Formatting.oneSpace());

    formatter.keywords('pipeline').append(Formatting.oneSpace());
    if (isPipeDefinition(node) || isBlockTypePipeline(node)) {
      formatter.keywords('->').prepend(Formatting.indent());
    }

    if (isCellRangeLiteral(node)) {
      formatter.keywords(':').append(Formatting.noSpace({ priority: 1 }));
    }
  }

  private formatParenthesis(node: AstNode, start: string, end: string) {
    const formatter = this.getNodeFormatter(node);
    if (!isCompositeCstNode(node.$cstNode)) {
      return;
    }

    const openingBraces = formatter.keywords(start);
    const closingBraces = formatter.keyword(end);
    const interior = formatter.interior(openingBraces, closingBraces);
    if (interior.nodes.length === 0) {
      openingBraces
        .prepend(Formatting.noIndent())
        .prepend(Formatting.oneSpace());
      closingBraces
        .prepend(Formatting.noIndent())
        .prepend(Formatting.oneSpace());
      return;
    }

    interior.prepend(Formatting.indent({ allowMore: true }));
    openingBraces.prepend(Formatting.noIndent()).prepend(Formatting.oneSpace());
    closingBraces.prepend(Formatting.noIndent()).prepend(Formatting.newLine());
  }

  /**
   * Overwrite to work around this issue:
   * https://github.com/eclipse-langium/langium/issues/1351
   */
  protected override createHiddenTextEdits(
    previous: CstNode | undefined,
    hidden: CstNode,
    formatting: FormattingAction | undefined,
    context: FormattingContext,
  ): TextEdit[] {
    const edits: TextEdit[] = [];

    // We only format hidden nodes that are on their own line.
    const startLine = hidden.range.start.line;
    if (previous && previous.range.end.line === startLine) {
      return edits;
    }

    const startRange: Range = {
      start: {
        character: 0,
        line: startLine,
      },
      end: hidden.range.start,
    };
    const hiddenStartText = context.document.getText(startRange);
    const move = this.findFittingMove(
      startRange,
      formatting?.moves ?? [],
      context,
    );

    const hiddenStartChar = this.getExistingIndentationCharacterCount(
      hiddenStartText,
      context,
    );
    const expectedStartChar = this.getIndentationCharacterCount(context, move);

    const newStartText = (context.options.insertSpaces ? ' ' : '\t').repeat(
      expectedStartChar,
    );

    // Compare exact texts instead of char numbers
    // to make sure the indent config (tabs vs. spaces) is respected.
    if (newStartText === hiddenStartText) {
      // Don't add unnecessary edits if there is nothing to do.
      return edits;
    }

    const lines = hidden.text.split('\n');
    lines[0] = hiddenStartText + lines[0];
    for (let i = 0; i < lines.length; i++) {
      const currentLine = startLine + i;

      // Replace the full start text, so tabs and spaces work in any case.
      edits.push({
        newText: newStartText,
        range: {
          start: {
            line: currentLine,
            character: 0,
          },
          end: {
            line: currentLine,
            character: hiddenStartChar,
          },
        },
      });
    }

    return edits;
  }
}
