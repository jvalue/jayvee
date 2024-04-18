// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type OperatorEvaluatorRegistry } from '../../expressions/operator-registry';
import { type CompositeBlockTypeDefinition } from '../../generated/ast';
import { type ValueTypeProvider } from '../value-type';
import { type WrapperFactoryProvider } from '../wrapper-factory-provider';

import { BlockTypeWrapper } from './block-type-wrapper';

export class CompositeBlockTypeWrapper extends BlockTypeWrapper {
  /**
   * Creates a CompositeBlockTypeWrapper if possible. Otherwise, throws error.
   * Use @see canBeWrapped to check whether wrapping will be successful.
   *
   * Use @see WrapperFactoryProvider for instantiation instead of calling this constructor directly.
   */
  constructor(
    private blockTypeDefinition: CompositeBlockTypeDefinition,
    operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
    valueTypeProvider: ValueTypeProvider,
    wrapperFactories: WrapperFactoryProvider,
  ) {
    super(
      blockTypeDefinition,
      operatorEvaluatorRegistry,
      valueTypeProvider,
      wrapperFactories,
    );
  }

  override getMissingRequiredPropertyNames(
    presentPropertyNames: string[] = [],
  ): string[] {
    const missingRequiredPropertyNames = super.getMissingRequiredPropertyNames(
      presentPropertyNames,
    );

    // We assume block type properties that have an expression as default value can be evaluated during runtime
    return missingRequiredPropertyNames.filter((propertyName) => {
      const blockTypeProperty = this.blockTypeDefinition.properties.find(
        (blockTypeProperty) => blockTypeProperty.name === propertyName,
      );

      return blockTypeProperty?.defaultValue === undefined;
    });
  }
}
