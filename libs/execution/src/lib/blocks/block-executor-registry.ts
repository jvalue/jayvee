// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockDefinition,
  isCompositeBlocktypeDefinition,
} from '@jvalue/jayvee-language-server';

import { JayveeExecExtension } from '../extension';

import { BlockExecutor } from './block-executor';
import { BlockExecutorClass } from './block-executor-class';
// eslint-disable-next-line import/no-cycle
import {
  createCompositeBlockExecutor,
  getInputType,
  getOutputType,
} from './composite-block-executor';

export function getBlockExecutorClass(
  blockTypeName: string,
  execExtension: JayveeExecExtension,
): BlockExecutorClass | undefined {
  return execExtension
    .getBlockExecutors()
    .find((x: BlockExecutorClass) => x.type === blockTypeName);
}

export function createBlockExecutor(
  block: BlockDefinition,
  execExtension: JayveeExecExtension,
): BlockExecutor {
  const blockType = block.type.ref;
  assert(blockType !== undefined);

  let blockExecutor = getBlockExecutorClass(blockType.name, execExtension);

  if (
    blockExecutor === undefined &&
    isCompositeBlocktypeDefinition(block.type.ref)
  ) {
    blockExecutor = createCompositeBlockExecutor(
      getInputType(block.type.ref),
      getOutputType(block.type.ref),
      block,
    );
  }

  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${blockType.name}`,
  );

  return new blockExecutor();
}
