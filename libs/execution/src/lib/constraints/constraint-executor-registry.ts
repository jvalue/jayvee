// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  ConstraintDefinition,
  Registry,
  isExpressionConstraintDefinition,
  isTypedConstraintDefinition,
} from '@jvalue/jayvee-language-server';
import { assertUnreachable } from 'langium';

import { ConstraintExecutor } from './constraint-executor';
import { AllowlistConstraintExecutor } from './executors/allowlist-constraint-executor';
import { DenylistConstraintExecutor } from './executors/denylist-constraint-executor';
import { ExpressionConstraintExecutor } from './executors/expression-constraint-executor';
import { LengthConstraintExecutor } from './executors/length-constraint-executor';
import { RangeConstraintExecutor } from './executors/range-constraint-executor';
import { RegexConstraintExecutor } from './executors/regex-constraint-executor';
import { TypedConstraintExecutorClass } from './typed-constraint-executor-class';

const constraintExecutorRegistry = new Registry<TypedConstraintExecutorClass>();

export function registerDefaultConstraintExecutors() {
  registerConstraintExecutor(AllowlistConstraintExecutor);
  registerConstraintExecutor(DenylistConstraintExecutor);
  registerConstraintExecutor(RegexConstraintExecutor);
  registerConstraintExecutor(LengthConstraintExecutor);
  registerConstraintExecutor(RangeConstraintExecutor);
}

export function registerConstraintExecutor(
  executorClass: TypedConstraintExecutorClass,
) {
  constraintExecutorRegistry.register(executorClass.type, executorClass);
}

export function getRegisteredConstraintExecutors(): TypedConstraintExecutorClass[] {
  return constraintExecutorRegistry.getAll();
}

export function createConstraintExecutor(
  constraint: ConstraintDefinition,
): ConstraintExecutor {
  if (isTypedConstraintDefinition(constraint)) {
    const constraintType = constraint.type.name;
    const constraintExecutor = constraintExecutorRegistry.get(constraintType);
    assert(
      constraintExecutor !== undefined,
      `No executor was registered for constraint type ${constraintType}`,
    );

    return new constraintExecutor();
  } else if (isExpressionConstraintDefinition(constraint)) {
    return new ExpressionConstraintExecutor(constraint);
  }
  assertUnreachable(constraint);
}
