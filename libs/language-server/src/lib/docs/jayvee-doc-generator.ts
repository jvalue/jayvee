// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type BlockTypeWrapper, type ConstraintTypeWrapper } from '../ast';
import { type ValueType } from '../ast/wrappers/value-type/value-type';

export interface JayveeBlockTypeDocGenerator {
  generateBlockTypeDoc(blockType: BlockTypeWrapper): string;
}

export interface JayveeConstraintTypeDocGenerator {
  generateConstraintTypeDoc(constraintType: ConstraintTypeWrapper): string;
}

export interface JayveeValueTypesDocGenerator {
  generateValueTypesDoc(valueTypes: ValueType[]): string;
}

export interface JayveePropertyDocGenerator {
  generatePropertyDoc(
    blockType: BlockTypeWrapper,
    propertyName: string,
  ): string | undefined;
}
