// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/working-with-the-ast for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { EvaluationContext } from '@jvalue/jayvee-language-server';
import { CompositeBlocktypeDefinition } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { validateBlocktypeDefinition } from './blocktype-definition';

export function validateCompositeBlockTypeDefinition(
  blockType: CompositeBlocktypeDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  validateBlocktypeDefinition(blockType, validationContext, evaluationContext);
}
