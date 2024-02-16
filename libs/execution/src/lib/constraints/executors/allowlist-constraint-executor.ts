// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  CollectionValuetype,
  InternalValueRepresentation,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../../execution-context';
import { implementsStatic } from '../../util/implements-static-decorator';
import { ConstraintExecutor } from '../constraint-executor';
import { TypedConstraintExecutorClass } from '../typed-constraint-executor-class';

@implementsStatic<TypedConstraintExecutorClass>()
export class AllowlistConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'AllowlistConstraint';

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const allowlist = context.getPropertyValue(
      'allowlist',
      new CollectionValuetype(PrimitiveValuetypes.Text),
    );
    return allowlist.includes(value);
  }
}
