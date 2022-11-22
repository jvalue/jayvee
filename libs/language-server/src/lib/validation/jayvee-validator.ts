import { ValidationChecks } from 'langium';

import type { JayveeAstType } from '..';

export interface JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType>;
}
