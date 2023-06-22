// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  ConstructorClass,
  IOType,
  JayveeLangExtension,
} from '../../lib';

import { TestPropertyMetaInformation } from './lib';

export class TestLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): Array<ConstructorClass<BlockMetaInformation>> {
    const ioTypes = Object.values(IOType);
    return [
      TestPropertyMetaInformation,
      ...ioTypes.map((ioType) =>
        this.constructBlockMetaInformationFromIOType(ioType, 'input'),
      ),
      ...ioTypes.map((ioType) =>
        this.constructBlockMetaInformationFromIOType(ioType, 'output'),
      ),
    ];
  }

  /**
   * Constructs BlockMetaInformation that is either an loader or extractor block, depending on the io param.
   * The name of the new Block is constructed `Test${ioType}${io === 'input' ? 'Loader' : 'Extractor'}`.
   * For example if ioType = IOType.File and io = 'input' -> 'TestFileLoader'
   * @param ioType IOType of the block input or output (depending on io param)
   * @param io specifies whether the given ioType param is the input or output of the block
   * @returns ConstructorClass<BlockMetaInformation>
   */
  constructBlockMetaInformationFromIOType(
    ioType: IOType,
    io: 'input' | 'output',
  ): ConstructorClass<BlockMetaInformation> {
    return class TestBlockMetaInformation extends BlockMetaInformation {
      constructor() {
        super(
          `Test${ioType}${io === 'input' ? 'Loader' : 'Extractor'}`,
          {},
          io === 'input' ? ioType : IOType.NONE,
          io === 'input' ? IOType.NONE : ioType,
        );
      }
    };
  }
}
