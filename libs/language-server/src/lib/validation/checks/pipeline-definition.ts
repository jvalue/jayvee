// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PipelineWrapper } from '../../ast';
import { PipelineDefinition } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';
import { checkUniqueNames } from '../validation-util';

export function validatePipelineDefinition(
  pipeline: PipelineDefinition,
  context: ValidationContext,
): void {
  checkStartingBlocks(pipeline, context);
  checkUniqueNames(pipeline.blocks, context);
  checkUniqueNames(pipeline.transforms, context);
  checkUniqueNames(pipeline.valuetypes, context);
  checkUniqueNames(pipeline.constraints, context);
}

function checkStartingBlocks(
  pipeline: PipelineDefinition,
  context: ValidationContext,
): void {
  const pipelineWrapper = new PipelineWrapper(pipeline);
  const startingBlocks = pipelineWrapper.getStartingBlocks();
  if (startingBlocks.length === 0) {
    context.accept(
      'error',
      `An extractor block is required for this pipeline`,
      {
        node: pipeline,
        property: 'name',
      },
    );
  }
}
