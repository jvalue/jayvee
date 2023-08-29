// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

// eslint-disable-next-line import/no-cycle
import {
  BlocktypeInput,
  BlocktypeOutput,
  CompositeBlocktypeDefinition,
  createValuetype,
  getIOType,
} from '../ast';

import { BlockMetaInformation } from './block-meta-inf';
import { PropertySpecification } from './meta-inf';

export class CompositeBlocktypeMetaInformation extends BlockMetaInformation {
  constructor(private blockTypeDefinition: CompositeBlocktypeDefinition) {
    const properties: Record<string, PropertySpecification> = {};

    for (const property of blockTypeDefinition.properties) {
      const valuetype = createValuetype(property.valuetype);
      assert(valuetype !== undefined);

      properties[property.name] = {
        type: valuetype,
      };
    }

    super(
      blockTypeDefinition.name,
      properties,
      getIOType(blockTypeDefinition.inputs[0] as BlocktypeInput),
      getIOType(blockTypeDefinition.outputs[0] as BlocktypeOutput),
    );
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

      return !blocktypeProperty?.defaultValue;
    });
  }
}
