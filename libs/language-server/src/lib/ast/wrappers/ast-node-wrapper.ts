import { AstNode } from 'langium';

export interface AstNodeWrapper<N extends AstNode> {
  readonly astNode: N;
}
