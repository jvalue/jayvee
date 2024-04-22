// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  type ConstraintDefinition,
  Registry,
  isExpressionConstraintDefinition,
  isTypedConstraintDefinition,
} from '@jvalue/jayvee-language-server';
import { assertUnreachable } from 'langium';

import { type ConstraintExecutor } from './constraint-executor.js';
import { AllowlistConstraintExecutor } from './executors/allowlist-constraint-executor.js';
import { DenylistConstraintExecutor } from './executors/denylist-constraint-executor.js';
import { ExpressionConstraintExecutor } from './executors/expression-constraint-executor.js';
import { LengthConstraintExecutor } from './executors/length-constraint-executor.js';
import { RangeConstraintExecutor } from './executors/range-constraint-executor.js';
import { RegexConstraintExecutor } from './executors/regex-constraint-executor.js';
import { type TypedConstraintExecutorClass } from './typed-constraint-executor-class.js';

export interface JayveeConstraintExtension {
  registerConstraintExecutor(executorClass: TypedConstraintExecutorClass): void;

  getConstraintExecutors(): TypedConstraintExecutorClass<ConstraintExecutor>[];

  createConstraintExecutor(
    constraint: ConstraintDefinition,
  ): ConstraintExecutor;
}

export class DefaultConstraintExtension
  extends Registry<TypedConstraintExecutorClass>
  implements JayveeConstraintExtension
{
  constructor() {
    super();

    this.registerConstraintExecutor(AllowlistConstraintExecutor);
    this.registerConstraintExecutor(DenylistConstraintExecutor);
    this.registerConstraintExecutor(RegexConstraintExecutor);
    this.registerConstraintExecutor(LengthConstraintExecutor);
    this.registerConstraintExecutor(RangeConstraintExecutor);
  }

  registerConstraintExecutor(executorClass: TypedConstraintExecutorClass) {
    this.register(executorClass.type, executorClass);
  }

  getConstraintExecutors() {
    return this.getAll();
  }

  createConstraintExecutor(
    constraint: ConstraintDefinition,
  ): ConstraintExecutor {
    if (isTypedConstraintDefinition(constraint)) {
      const constraintType = constraint.type.ref?.name;
      assert(
        constraintType !== undefined,
        `Could not resolve reference to constraint type of ${constraint.name}`,
      );
      const constraintExecutor = this.get(constraintType);
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
}
