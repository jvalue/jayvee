// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { BlockExecutorClass } from './blocks/block-executor-class';

export abstract class JayveeExecExtension {
  abstract getBlockExecutors(): BlockExecutorClass[];

  getExecutorForBlockType(
    blockTypeName: string,
  ): BlockExecutorClass | undefined {
    return this.getBlockExecutors().find(
      (x: BlockExecutorClass) => x.type === blockTypeName,
    );
  }
}
