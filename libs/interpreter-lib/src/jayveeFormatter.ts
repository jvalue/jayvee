import * as ast from '@jvalue/jayvee-language-server';
import {
  AbstractFormatter,
  AstNode,
  CstNode,
  Formatting,
  isCommentNode,
  isCompositeCstNode,
} from 'langium';

function isComment(node: CstNode) {
  return isCommentNode(node, ['SL_COMMENT', 'ML_COMMENT']) === true;
}

export class JayveeFormatter extends AbstractFormatter {
  private isFirstCall = true;
  protected override format(node: AstNode) {
    if (this.isFirstCall) {
      node.$cstNode;
      this.isFirstCall = false;
    }

    console.log(node.$type);
    const formatter = this.getNodeFormatter(node);
    if (isCompositeCstNode(node.$cstNode)) {
      // if (!isJayveeModel(node)) {
      // }

      const openingBraces = formatter.keyword('{');
      const closingBraces = formatter.keyword('}');
      // formatter
      //   .interior(openingBraces, closingBraces)
      //   .prepend(Formatting.indent());
      openingBraces
        .prepend(Formatting.noIndent())
        .prepend(Formatting.oneSpace());
      closingBraces
        .prepend(Formatting.noIndent())
        .prepend(Formatting.newLine());

      const cstNodes = formatter.interior(openingBraces, closingBraces).nodes;
      formatter
        .cst(cstNodes)
        // .prepend(Formatting.noIndent())
        .prepend(Formatting.indent());
      // .prepend(Formatting.newLine())
      // .prepend(Formatting.spaces(2));

      if (ast.isCollectionLiteral(node)) {
        const openingBraces = formatter.keyword('[');
        const closingBraces = formatter.keyword(']');
        formatter
          .interior(openingBraces, closingBraces)
          .prepend(Formatting.indent());
        closingBraces
          .prepend(Formatting.newLine())
          .prepend(Formatting.noIndent());
        formatter.keywords(',').prepend(Formatting.noSpace());
      }

      if (ast.isPipeDefinition(node)) {
        const arrows = formatter.keywords('->');
        arrows.prepend(Formatting.indent());
      }

      if (!ast.isJayveeModel(node)) {
        const strings = node.$cstNode.children.map((c) => c.text);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // noinspection JSConstantReassignment
        // node.$cstNode.hidden = false;
        // formatter
        //   .cst(node.$cstNode.children.filter(isComment))
        //   .prepend(Formatting.noSpace());
        // .prepend(Formatting.)
        // .prepend(Formatting.newLines(1))
        // .prepend({ moves: [{ tabs: 2 }], options: {} });
        // .prepend(Formatting.spaces(2));
        // .prepend({ moves: [{ tabs: 2 }], options: {} });
      }
      // .prepend(Formatting.indent({ allowLess: false, allowMore: false }));
      // .prepend(Formatting.spaces(5));
    }

    // const bracesClose = formatter.keyword('}');
    // bracesClose.prepend(Formatting.newLine());
    // formatter.node(node).prepend(Formatting.newLine());
  }
}
