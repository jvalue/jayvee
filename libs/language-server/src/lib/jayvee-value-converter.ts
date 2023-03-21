import { CstNode, DefaultValueConverter, ValueType } from 'langium';
import { AbstractRule } from 'langium/lib/grammar/generated/ast';

export class JayveeValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: AbstractRule,
    input: string,
    cstNode: CstNode,
  ): ValueType {
    if (rule.name.toUpperCase() === 'REGEX_LITERAL') {
      // Trim leading and trailing '/' character:
      return input.substring(1, input.length - 1);
    }
    return super.runConverter(rule, input, cstNode);
  }
}
