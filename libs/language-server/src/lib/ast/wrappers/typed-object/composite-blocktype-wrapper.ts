// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type OperatorEvaluatorRegistry } from '../../expressions/operator-registry';
import { CompositeBlocktypeDefinition } from '../../generated/ast';
import { type WrapperFactoryProvider } from '../wrapper-factory-provider';

// eslint-disable-next-line import/no-cycle
import { BlockTypeWrapper } from './blocktype-wrapper';

export class CompositeBlocktypeWrapper extends BlockTypeWrapper {
  /**
   * Creates a CompositeBlocktypeWrapper if possible. Otherwise, throws error.
   * Use @see canBeWrapped to check whether wrapping will be successful.
   *
   * Use @see WrapperFactoryProvider for instantiation instead of calling this constructor directly.
   */
  constructor(
    private blockTypeDefinition: CompositeBlocktypeDefinition,
    operatorEvaluatiorRegistry: OperatorEvaluatorRegistry,
    wrapperFactories: WrapperFactoryProvider,
  ) {
    super(blockTypeDefinition, operatorEvaluatiorRegistry, wrapperFactories);
  }

  override getMissingRequiredPropertyNames(
    presentPropertyNames: string[] = [],
  ): string[] {
    const missingRequiredPropertyNames = super.getMissingRequiredPropertyNames(
      presentPropertyNames,
    );

    // We assume blocktype properties that have an expression as default value can be evaluated during runtime
    return missingRequiredPropertyNames.filter((propertyName) => {
      const blocktypeProperty = this.blockTypeDefinition.properties.find(
        (blocktypeProperty) => blocktypeProperty.name === propertyName,
      );

      return blocktypeProperty?.defaultValue === undefined;
    });
  }
}
