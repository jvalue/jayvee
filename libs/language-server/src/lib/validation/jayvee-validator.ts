import { ValidationChecks } from 'langium';

import type { JayveeAstType } from '../ast/generated/ast';

export interface JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType>;
}
