// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { RdbmsLangExtension } from '@jvalue/extensions/rdbms/lang';
import { TabularLangExtension } from '@jvalue/extensions/tabular/lang';
import {
  BlockMetaInformation,
  ConstructorClass,
  JayveeLangExtension,
} from '@jvalue/language-server';

import { ArchiveInterpreterMetaInformation } from './archive-interpreter-meta-inf';
import { FilePickerMetaInformation } from './file-picker-meta-inf';
import { GtfsRTInterpreterMetaInformation } from './gtfs-rt-interpreter-meta-inf';
import { HttpExtractorMetaInformation } from './http-extractor-meta-inf';
import { TextFileInterpreterMetaInformation } from './text-file-interpreter-meta-inf';
import { TextRangeSelectorMetaInformation } from './text-range-selector-meta-inf';

export class StdLangExtension implements JayveeLangExtension {
  private readonly wrappedExtensions: JayveeLangExtension[] = [
    new TabularLangExtension(),
    new RdbmsLangExtension(),
  ];

  getBlockMetaInf(): Array<ConstructorClass<BlockMetaInformation>> {
    return [
      ...this.wrappedExtensions.map((x) => x.getBlockMetaInf()).flat(),
      HttpExtractorMetaInformation,
      TextFileInterpreterMetaInformation,
      TextRangeSelectorMetaInformation,
      ArchiveInterpreterMetaInformation,
      FilePickerMetaInformation,
      GtfsRTInterpreterMetaInformation,
    ];
  }
}
