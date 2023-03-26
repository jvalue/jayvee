// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { ValuetypeVisitor } from './valuetype-visitor';

export interface VisitableValuetype {
  acceptVisitor(visitor: ValuetypeVisitor): void;
}
