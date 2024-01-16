// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { EvaluationContext } from '../../ast/expressions/evaluation';
import { CompositeBlocktypeDefinition } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';

import { validateBlocktypeDefinition } from './blocktype-definition';
import { checkMultipleBlockInputs } from './pipeline-definition';

export function validateCompositeBlockTypeDefinition(
  blockType: CompositeBlocktypeDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  validateBlocktypeDefinition(blockType, validationContext, evaluationContext);
  checkHasPipeline(blockType, validationContext);
  checkExactlyOnePipeline(blockType, validationContext);

  checkMultipleBlockInputs(blockType, validationContext);
}

function checkHasPipeline(
  blockType: CompositeBlocktypeDefinition,
  context: ValidationContext,
): void {
  if (blockType.pipes.length === 0) {
    context.accept(
      'error',
      `Composite blocktypes must define one pipeline '${blockType.name}'`,
      {
        node: blockType,
        property: 'name',
      },
    );
  }
}

function checkExactlyOnePipeline(
  blockType: CompositeBlocktypeDefinition,
  context: ValidationContext,
): void {
  if (blockType.pipes.length > 1) {
    blockType.pipes.forEach((pipe) => {
      context.accept(
        'error',
        `Found more than one pipeline definition in composite blocktype '${blockType.name}'`,
        {
          node: pipe,
        },
      );
    });
  }
}
