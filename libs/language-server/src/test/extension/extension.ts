// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  ConstructorClass,
  JayveeLangExtension,
} from '../../lib';

import {
  TestFileExtractorMetaInformation,
  TestPropertyMetaInformation,
  TestTableLoaderMetaInformation,
} from './lib';

export class TestLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): Array<ConstructorClass<BlockMetaInformation>> {
    return [
      TestFileExtractorMetaInformation,
      TestPropertyMetaInformation,
      TestTableLoaderMetaInformation,
    ];
  }
}
