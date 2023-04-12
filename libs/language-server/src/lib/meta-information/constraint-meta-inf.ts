// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationAcceptor } from 'langium';

import { PrimitiveValuetypeKeyword, PropertyBody } from '../ast/generated/ast';

// eslint-disable-next-line import/no-cycle
import { ExampleDoc, MetaInformation, PropertySpecification } from './meta-inf';

interface ConstraintDocs {
  description?: string;
  examples?: ExampleDoc[];
}

export abstract class ConstraintMetaInformation extends MetaInformation {
  docs: ConstraintDocs = {};
  protected constructor(
    constraintType: string,
    properties: Record<string, PropertySpecification>,
    public readonly compatiblePrimitiveValuetypes: PrimitiveValuetypeKeyword[],
    validation?: (property: PropertyBody, accept: ValidationAcceptor) => void,
  ) {
    super(constraintType, properties, validation);
  }
}
