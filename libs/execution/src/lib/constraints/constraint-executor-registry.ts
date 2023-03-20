import { strict as assert } from 'assert';

import { Constraint } from '@jvalue/language-server';

import { ConstraintExecutor } from './constraint-executor';
import { ConstraintExecutorClass } from './constraint-executor-class';
import { BlacklistConstraintExecutor } from './executors/blacklist-constraint-executor';
import { LengthConstraintExecutor } from './executors/length-constraint-executor';
import { RangeConstraintExecutor } from './executors/range-constraint-executor';
import { RegexConstraintExecutor } from './executors/regex-constraint-executor';
import { WhitelistConstraintExecutor } from './executors/whitelist-constraint-executor';

const registeredConstraintExecutors = new Map<
  string,
  ConstraintExecutorClass
>();

export function registerDefaultConstraintExecutors() {
  registerConstraintExecutor(WhitelistConstraintExecutor);
  registerConstraintExecutor(BlacklistConstraintExecutor);
  registerConstraintExecutor(RegexConstraintExecutor);
  registerConstraintExecutor(LengthConstraintExecutor);
  registerConstraintExecutor(RangeConstraintExecutor);
}

export function registerConstraintExecutor(
  constraintExecutor: ConstraintExecutorClass,
) {
  const constraintType = new constraintExecutor().constraintType;
  assert(
    !registeredConstraintExecutors.has(constraintType),
    `Multiple executors were registered for constraint type ${constraintType}`,
  );

  registeredConstraintExecutors.set(constraintType, constraintExecutor);
}

export function createConstraintExecutor(
  constraint: Constraint,
): ConstraintExecutor {
  const constraintType = constraint.type.name;
  const constraintExecutor = registeredConstraintExecutors.get(constraintType);
  assert(
    constraintExecutor !== undefined,
    `No executor was registered for constraint type ${constraintType}`,
  );

  return new constraintExecutor();
}
