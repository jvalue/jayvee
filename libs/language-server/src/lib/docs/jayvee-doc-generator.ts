// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockMetaInformation } from '../meta-information/block-meta-inf';

export interface JayveeBlockTypeDocGenerator {
  generateBlockTypeDoc(metaInf: BlockMetaInformation): string;
}

export interface JayveePropertyDocGenerator {
  generatePropertyDoc(
    metaInf: BlockMetaInformation,
    propertyName: string,
  ): string | undefined;
}
