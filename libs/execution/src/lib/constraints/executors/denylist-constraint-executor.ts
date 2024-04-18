// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../../execution-context';
import { implementsStatic } from '../../util/implements-static-decorator';
import { type ConstraintExecutor } from '../constraint-executor';
import { type TypedConstraintExecutorClass } from '../typed-constraint-executor-class';

@implementsStatic<TypedConstraintExecutorClass>()
export class DenylistConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'DenylistConstraint';

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const denylist = context.getPropertyValue(
      'denylist',
      context.valueTypeProvider.createCollectionValueTypeOf(
        context.valueTypeProvider.Primitives.Text,
      ),
    );
    return !denylist.includes(value);
  }
}
