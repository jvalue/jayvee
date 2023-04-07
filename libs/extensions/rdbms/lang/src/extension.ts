// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  ConstructorClass,
  JayveeLangExtension,
} from '@jvalue/jayvee-language-server';

import {
  PostgresLoaderMetaInformation,
  SQLiteLoaderMetaInformation,
} from './lib';

export class RdbmsLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): Array<ConstructorClass<BlockMetaInformation>> {
    return [PostgresLoaderMetaInformation, SQLiteLoaderMetaInformation];
  }
}
