// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Valuetype } from '../ast/wrappers/value-type/valuetype';
import { ConstraintMetaInformation } from '../meta-information';
import { BlockMetaInformation } from '../meta-information/block-meta-inf';

export interface JayveeBlockTypeDocGenerator {
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string;
}

export interface JayveeConstraintTypeDocGenerator {
  generateConstraintTypeDoc(metaInf: ConstraintMetaInformation): string;
}

export interface JayveeValueTypesDocGenerator {
  generateValueTypesDoc(valueTypes: { [name: string]: Valuetype }): string;
}

export interface JayveePropertyDocGenerator {
  generatePropertyDoc(
    metaInf: BlockMetaInformation,
    propertyName: string,
  ): string | undefined;
}
