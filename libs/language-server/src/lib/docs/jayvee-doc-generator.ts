// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockTypeWrapper, ConstraintWrapper } from '../ast';
import { Valuetype } from '../ast/wrappers/value-type/valuetype';

export interface JayveeBlockTypeDocGenerator {
  generateBlockTypeDoc(metaInf: BlockTypeWrapper): string;
}

export interface JayveeConstraintTypeDocGenerator {
  generateConstraintTypeDoc(metaInf: ConstraintWrapper): string;
}

export interface JayveeValueTypesDocGenerator {
  generateValueTypesDoc(valueTypes: { [name: string]: Valuetype }): string;
}

export interface JayveePropertyDocGenerator {
  generatePropertyDoc(
    metaInf: BlockTypeWrapper,
    propertyName: string,
  ): string | undefined;
}
