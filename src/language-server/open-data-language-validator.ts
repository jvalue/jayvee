import {
  ValidationAcceptor,
  ValidationChecks,
  ValidationRegistry,
} from 'langium';

import { OpenDataLanguageAstType, Person } from './generated/ast';
import type { OpenDataLanguageServices } from './open-data-language-module';

/**
 * Registry for validation checks.
 */
export class OpenDataLanguageValidationRegistry extends ValidationRegistry {
  constructor(services: OpenDataLanguageServices) {
    super(services);
    const validator = services.validation.OpenDataLanguageValidator;
    const checks: ValidationChecks<OpenDataLanguageAstType> = {
      Person: validator.checkPersonStartsWithCapital,
    };
    this.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class OpenDataLanguageValidator {
  checkPersonStartsWithCapital(
    this: void,
    person: Person,
    accept: ValidationAcceptor,
  ): void {
    if (person.name) {
      const firstChar = person.name.substring(0, 1);
      if (firstChar.toUpperCase() !== firstChar) {
        accept('warning', 'Person name should start with a capital.', {
          node: person,
          property: 'name',
        });
      }
    }
  }
}
