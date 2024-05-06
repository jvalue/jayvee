// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type CstNode,
  DefaultValueConverter,
  type GrammarAST,
  type ValueType,
} from 'langium';

export class JayveeValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode,
  ): ValueType {
    if (rule.name === 'REGEX') {
      // Trim leading and trailing '/' character:
      return input.substring(1, input.length - 1);
    }
    return super.runConverter(rule, input, cstNode);
  }
}
