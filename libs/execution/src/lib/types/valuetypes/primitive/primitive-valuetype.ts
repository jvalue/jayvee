// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValuetypeKeywordLiteral } from '@jvalue/language-server';

// eslint-disable-next-line import/no-cycle
import { Valuetype } from '../valuetype';

export type PrimitiveType = string | number | boolean;

export type PrimitiveValuetype<T extends PrimitiveType = PrimitiveType> =
  Valuetype<PrimitiveValuetypeKeywordLiteral, T>;
