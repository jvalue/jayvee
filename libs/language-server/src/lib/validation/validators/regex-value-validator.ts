import { ValidationAcceptor, ValidationChecks } from 'langium';

import { JayveeAstType, RegexLiteral } from '../../ast';
import { JayveeValidator } from '../jayvee-validator';

export class RegexValueValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      RegexLiteral: [this.checkRegexParsability],
    };
  }

  checkRegexParsability(
    this: void,
    regexValue: RegexLiteral,
    accept: ValidationAcceptor,
  ): void {
    try {
      new RegExp(regexValue.value);
    } catch (error) {
      if (error instanceof SyntaxError) {
        accept('error', `A parsing error occurred: ${error.message}`, {
          node: regexValue,
        });
      } else {
        accept(
          'error',
          `An unknown parsing error occurred: ${JSON.stringify(error)}.`,
          {
            node: regexValue,
          },
        );
      }
    }
  }
}
