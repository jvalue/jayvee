import { BlockMetaInformation, BlockType } from '@jayvee/language-server';

import * as R from './execution-result';

export abstract class BlockExecutor<
  B extends BlockType,
  InType = unknown,
  OutType = unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  M extends BlockMetaInformation<B, InType, OutType> = BlockMetaInformation<B>,
> {
  constructor(
    readonly block: B,
    readonly runtimeParameters: Map<string, string | number | boolean>,
  ) {}

  abstract execute(input: InType): Promise<R.Result<OutType>>;
}
