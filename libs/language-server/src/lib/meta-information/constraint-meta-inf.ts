// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { EvaluationContext } from '../ast/expressions/evaluation';
import { PropertyBody } from '../ast/generated/ast';
import { Valuetype } from '../ast/wrappers/value-type/valuetype';
import { ValidationContext } from '../validation/validation-context';

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
    public readonly compatibleValuetype: Valuetype,
    validation?: (
      property: PropertyBody,
      validationContext: ValidationContext,
      evaluationContext: EvaluationContext,
    ) => void,
  ) {
    super(constraintType, properties, validation);
  }
}
