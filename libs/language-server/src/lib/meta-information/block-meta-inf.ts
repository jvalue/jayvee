// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationAcceptor } from 'langium';

import { PropertyBody } from '../ast/generated/ast';
// eslint-disable-next-line import/no-cycle
import { IOType } from '../ast/model-util';

import { ExampleDoc, MetaInformation, PropertySpecification } from './meta-inf';

interface BlockDocs {
  description?: string;
  examples?: ExampleDoc[];
}

export abstract class BlockMetaInformation extends MetaInformation {
  docs: BlockDocs = {};

  protected constructor(
    blockType: string,
    properties: Record<string, PropertySpecification>,
    public readonly inputType: IOType,
    public readonly outputType: IOType,
    validation?: (property: PropertyBody, accept: ValidationAcceptor) => void,
  ) {
    super(blockType, properties, validation);
  }

  canBeConnectedTo(blockAfter: BlockMetaInformation): boolean {
    return this.outputType === blockAfter.inputType;
  }

  hasInput(): boolean {
    return this.inputType !== IOType.NONE;
  }

  hasOutput(): boolean {
    return this.outputType !== IOType.NONE;
  }
}
