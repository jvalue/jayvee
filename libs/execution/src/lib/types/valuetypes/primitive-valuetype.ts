// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValuetypeKeyword } from '@jvalue/language-server';

// eslint-disable-next-line import/no-cycle
import { Valuetype } from './valuetype';

export type PrimitiveType = string | number | boolean;

export interface PrimitiveValuetype<T extends PrimitiveType = PrimitiveType>
  extends Valuetype<T> {
  readonly primitiveValuetypeKeyword: PrimitiveValuetypeKeyword;
}
