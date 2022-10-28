import { BlockType } from '../../language-server/generated/ast';
import { BlockMetaInformation } from '../../language-server/meta-information/block-meta-inf';

import * as R from './execution-result';

export abstract class BlockExecutor<
  B extends BlockType,
  InType = unknown,
  OutType = unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  M extends BlockMetaInformation<B, InType, OutType> = BlockMetaInformation<B>,
> {
  constructor(readonly block: B) {}

  abstract execute(input: InType): Promise<R.Result<OutType>>;
}
