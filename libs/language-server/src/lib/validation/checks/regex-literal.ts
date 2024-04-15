// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type RegexLiteral } from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

export function validateRegexLiteral(
  regex: RegexLiteral,
  props: JayveeValidationProps,
): void {
  checkRegexParsability(regex, props);
}

function checkRegexParsability(
  regex: RegexLiteral,
  props: JayveeValidationProps,
): void {
  const regexValue = regex?.value;
  if (regexValue === undefined) {
    return;
  }
  try {
    new RegExp(regexValue);
  } catch (error) {
    if (error instanceof SyntaxError) {
      props.validationContext.accept(
        'error',
        `A parsing error occurred: ${error.message}`,
        {
          node: regex,
        },
      );
    } else {
      props.validationContext.accept(
        'error',
        `An unknown parsing error occurred: ${JSON.stringify(error)}.`,
        {
          node: regex,
        },
      );
    }
  }
}
