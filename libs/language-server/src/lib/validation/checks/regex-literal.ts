// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { RegexLiteral } from '../../ast';
import { ValidationContext } from '../validation-context';

export function validateRegexLiteral(
  regex: RegexLiteral,
  context: ValidationContext,
): void {
  checkRegexParsability(regex, context);
}

function checkRegexParsability(
  regex: RegexLiteral,
  context: ValidationContext,
): void {
  try {
    new RegExp(regex.value);
  } catch (error) {
    if (error instanceof SyntaxError) {
      context.accept('error', `A parsing error occurred: ${error.message}`, {
        node: regex,
      });
    } else {
      context.accept(
        'error',
        `An unknown parsing error occurred: ${JSON.stringify(error)}.`,
        {
          node: regex,
        },
      );
    }
  }
}
