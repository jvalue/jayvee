// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  ConstructorClass,
  JayveeLangExtension,
} from '../../lib';

import {
  TestFileOutputMetaInformation,
  TestPropertyMetaInformation,
  TestTableInputMetaInformation,
} from './lib';

export class TestLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): Array<ConstructorClass<BlockMetaInformation>> {
    return [
      TestFileOutputMetaInformation,
      TestPropertyMetaInformation,
      TestTableInputMetaInformation,
    ];
  }
}
