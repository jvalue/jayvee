import { ValidationChecks, ValidationRegistry } from 'langium';

import { OpenDataLanguageAstType } from './generated/ast';
import type { OpenDataLanguageServices } from './open-data-language-module';

/**
 * Registry for validation checks.
 */
export class OpenDataLanguageValidationRegistry extends ValidationRegistry {
  constructor(services: OpenDataLanguageServices) {
    super(services);
    const validator = services.validation.OpenDataLanguageValidator;
    const checks: ValidationChecks<OpenDataLanguageAstType> = {};
    this.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class OpenDataLanguageValidator {}
