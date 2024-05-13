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

import { isPipeDefinition } from '../ast/generated/ast';

export class JayveeFormatter extends AbstractFormatter {
  protected override format(node: AstNode) {
    const formatter = this.getNodeFormatter(node);
    this.formatParenthesis(node, '{', '}');
    this.formatParenthesis(node, '[', ']');

    formatter.keywords(',', ':', ';').prepend(Formatting.noSpace());
    formatter.keywords(':').append(Formatting.oneSpace());
    formatter.keywords('block').append(Formatting.oneSpace());
    formatter.keywords('oftype', 'cell').surround(Formatting.oneSpace());

    if (isPipeDefinition(node)) {
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
    if (interior.nodes.length > 0) {
      interior.prepend(Formatting.indent({ allowMore: true }));
      openingBraces
        .prepend(Formatting.noIndent())
        .prepend(Formatting.oneSpace());
      closingBraces
        .prepend(Formatting.noIndent())
        .prepend(Formatting.newLine());
    } else {
      openingBraces
        .prepend(Formatting.noIndent())
        .prepend(Formatting.oneSpace());
      closingBraces
        .prepend(Formatting.noIndent())
        .prepend(Formatting.oneSpace());
    }
  }

  override formatDocument(
    document: LangiumDocument,
    params: DocumentFormattingParams,
  ): MaybePromise<TextEdit[]> {
    return super.formatDocument(document, params);
  }
}
