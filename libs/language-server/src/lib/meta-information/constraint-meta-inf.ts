import { PrimitiveValuetype } from '../ast/generated/ast';

import { AttributeSpecification, MetaInformation } from './meta-inf';

export abstract class ConstraintMetaInformation extends MetaInformation {
  protected constructor(
    constraintType: string,
    attributes: Record<string, AttributeSpecification>,
    public readonly primitiveValuetype: PrimitiveValuetype,
  ) {
    super(constraintType, attributes);
  }
}
