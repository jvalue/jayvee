import {
  type AstNode,
  type LangiumDocument,
  type MaybePromise,
  isCompositeCstNode,
} from 'langium';
import { AbstractFormatter, Formatting } from 'langium/lsp';
import {
  type DocumentFormattingParams,
  type TextEdit,
} from 'vscode-languageserver-protocol';

import { isBlockTypePipeline, isPipeDefinition } from '../ast/generated/ast';

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
    formatter
      .keywords('valuetype', 'constraints')
      .append(Formatting.oneSpace());
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

  override formatDocument(
    document: LangiumDocument,
    params: DocumentFormattingParams,
  ): MaybePromise<TextEdit[]> {
    return super.formatDocument(document, params);
  }
}
