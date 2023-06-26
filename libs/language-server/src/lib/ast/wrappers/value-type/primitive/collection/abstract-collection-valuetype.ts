// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../../expressions/internal-value-representation';
// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetype } from '../primitive-valuetype';

export type ToArray<I extends InternalValueRepresentation | undefined> =
  I extends InternalValueRepresentation ? Array<I> : [];

export abstract class AbstractCollectionValuetype<
  I extends InternalValueRepresentation | undefined,
> extends PrimitiveValuetype<ToArray<I>> {
  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }
}
