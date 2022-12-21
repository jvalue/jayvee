import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';
import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

import { LayoutValidatorExecutor, LayoutValidatorMetaInformation } from './lib';

export class LayoutExtension
  implements JayveeLangExtension, JayveeInterpreterExtension
{
  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return [LayoutValidatorExecutor];
  }

  getBlockMetaInf(): BlockMetaInformation[] {
    return [new LayoutValidatorMetaInformation()];
  }
}
