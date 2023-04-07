// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ExecutionContext } from '../../execution-context';
import { implementsStatic } from '../../util/implements-static-decorator';
import { ConstraintExecutor } from '../constraint-executor';
import { ConstraintExecutorClass } from '../constraint-executor-class';

@implementsStatic<ConstraintExecutorClass>()
export class AllowlistConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'AllowlistConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const allowlist = context.getTextCollectionPropertyValue('allowlist');
    const allowlistValues = allowlist.map((e) => e.value);
    return allowlistValues.includes(value);
  }
}
