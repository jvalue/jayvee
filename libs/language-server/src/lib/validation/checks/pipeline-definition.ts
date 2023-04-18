// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationAcceptor } from 'langium';

import { PipelineDefinition } from '../../ast/generated/ast';
import { collectStartingBlocks } from '../../ast/model-util';
import { checkUniqueNames } from '../validation-util';

export function validatePipelineDefinition(
  pipeline: PipelineDefinition,
  accept: ValidationAcceptor,
): void {
  checkStartingBlocks(pipeline, accept);
  checkUniqueNames(pipeline.blocks, accept);
}

function checkStartingBlocks(
  pipeline: PipelineDefinition,
  accept: ValidationAcceptor,
): void {
  const startingBlocks = collectStartingBlocks(pipeline);
  if (startingBlocks.length === 0) {
    accept('error', `An extractor block is required for this pipeline`, {
      node: pipeline,
      property: 'name',
    });
  }
}
