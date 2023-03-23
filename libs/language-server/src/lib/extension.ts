// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockMetaInformation } from './meta-information';
import { registerMetaInformation } from './meta-information/meta-inf-registry';
import { ConstructorClass } from './util/constructor-class';

export interface JayveeLangExtension {
  getBlockMetaInf(): Array<ConstructorClass<BlockMetaInformation>>;
}

export function useExtension(extension: JayveeLangExtension) {
  extension.getBlockMetaInf().forEach(registerMetaInformation);
}
