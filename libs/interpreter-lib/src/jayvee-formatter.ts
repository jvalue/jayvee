import {
  isCollectionLiteral,
  isPipeDefinition,
} from '@jvalue/jayvee-language-server';
import {
  AbstractFormatter,
  AstNode,
  Formatting,
  LangiumDocument,
  MaybePromise,
  NodeFormatter,
  isCompositeCstNode,
} from 'langium';
import { TextEdit } from 'vscode-languageserver';
import { DocumentFormattingParams } from 'vscode-languageserver-protocol';

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
