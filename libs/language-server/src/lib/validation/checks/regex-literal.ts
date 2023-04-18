// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationAcceptor } from 'langium';

import { RegexLiteral } from '../../ast';

export function validateRegexLiteral(
  regex: RegexLiteral,
  accept: ValidationAcceptor,
): void {
  checkRegexParsability(regex, accept);
}

function checkRegexParsability(
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
