// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

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
    regex: RegexLiteral,
    accept: ValidationAcceptor,
  ): void {
    try {
      new RegExp(regex.value);
    } catch (error) {
      if (error instanceof SyntaxError) {
        accept('error', `A parsing error occurred: ${error.message}`, {
          node: regex,
        });
      } else {
        accept(
          'error',
          `An unknown parsing error occurred: ${JSON.stringify(error)}.`,
          {
            node: regex,
          },
        );
      }
    }
  }
}
