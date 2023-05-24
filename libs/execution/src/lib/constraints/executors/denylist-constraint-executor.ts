// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { evaluateExpression } from '@jvalue/jayvee-language-server';

import { ExecutionContext } from '../../execution-context';
import { implementsStatic } from '../../util/implements-static-decorator';
import { ConstraintExecutor } from '../constraint-executor';
import { TypedConstraintExecutorClass } from '../typed-constraint-executor-class';

@implementsStatic<TypedConstraintExecutorClass>()
export class DenylistConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'DenylistConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const denylist = context.getExpressionCollectionPropertyValue('denylist');
    const denylistValues = denylist.map((expression) => {
      const value = evaluateExpression(expression, context.evaluationContext);
      assert(typeof value === 'string');
      return value;
    });
    return !denylistValues.includes(value);
  }
}
