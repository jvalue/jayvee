// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CompositeBlocktypeDefinition,
  PropertySpecification,
  createValuetype,
} from '@jvalue/jayvee-language-server';
import { strict as assert } from 'assert';
import { getIOType } from 'libs/language-server/src/lib/ast/io-type';

export class CompositeBlocktypeMetaInformation extends BlockMetaInformation {
  constructor(blockTypeDefinition: CompositeBlocktypeDefinition) {
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
      getIOType(blockTypeDefinition.inputs[0]!),
      getIOType(blockTypeDefinition.outputs[0]!),
    );
  }
}
