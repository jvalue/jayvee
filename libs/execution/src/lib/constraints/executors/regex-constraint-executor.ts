// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../../execution-context.js';
import { implementsStatic } from '../../util/implements-static-decorator.js';
import { type ConstraintExecutor } from '../constraint-executor.js';
import { type TypedConstraintExecutorClass } from '../typed-constraint-executor-class.js';

@implementsStatic<TypedConstraintExecutorClass>()
export class RegexConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'RegexConstraint';

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const regex = context.getPropertyValue(
      'regex',
      context.valueTypeProvider.Primitives.Regex,
    );
    return regex.test(value);
  }
}
