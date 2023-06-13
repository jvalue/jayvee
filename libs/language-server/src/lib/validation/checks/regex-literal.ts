// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { RegexLiteral } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';

/**
 * See https://jvalue.github.io/jayvee/docs/dev/working-with-the-ast for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

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
  const regexValue = regex?.value;
  if (regexValue === undefined) {
    return;
  }
  try {
    new RegExp(regexValue);
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
