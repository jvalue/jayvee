// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type CstNode, DefaultValueConverter, type ValueType } from 'langium';
import { type AbstractRule } from 'langium/lib/grammar/generated/ast';

export class JayveeValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: AbstractRule,
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
