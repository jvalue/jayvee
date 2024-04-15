// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../../expressions/internal-value-representation';
import { PrimitiveValueType } from '../primitive-value-type';

export type ToArray<I extends InternalValueRepresentation | undefined> =
  I extends InternalValueRepresentation ? I[] : [];

export abstract class AbstractCollectionValueType<
  I extends InternalValueRepresentation | undefined,
> extends PrimitiveValueType<ToArray<I>> {
  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }
}
