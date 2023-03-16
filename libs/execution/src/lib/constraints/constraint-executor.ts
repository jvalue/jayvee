import { strict as assert } from 'assert';

import {
  Attribute,
  CellRangeWrapper,
  Constraint,
  TextValue,
  ValuetypeAssignment,
  getOrFailBlockMetaInformation,
  isCellRange,
  isCellRangeValue,
  isCollection,
  isRuntimeParameter,
  isTextValue,
  isValuetypeAssignmentValue,
} from '@jvalue/language-server';
import { isReference } from 'langium';

export abstract class ConstraintExecutor {
  private _constraint?: Constraint;
  private _runtimeParameters?: Map<string, string | number | boolean>;

  protected constructor(readonly constraintType: string) {}

  get constraint(): Constraint {
    assert(
      this._constraint !== undefined,
      `No constraint was set for the executor of constraint type ${this.constraintType}`,
    );

    return this._constraint;
  }

  set constraint(constraint: Constraint) {
    assert(
      constraint.type.name === this.constraintType,
      `The provided constraint does not match the desired type: expected ${this.constraintType}, actual ${constraint.type.name}`,
    );

    this._constraint = constraint;
  }

  set runtimeParameters(
    runtimeParameters: Map<string, string | number | boolean>,
  ) {
    this._runtimeParameters = runtimeParameters;
  }

  get runtimeParameters(): Map<string, string | number | boolean> {
    assert(
      this._runtimeParameters !== undefined,
      `No runtime parameters were set for the executor of constraint type ${this.constraintType}`,
    );

    return this._runtimeParameters;
  }

  abstract isValid(value: unknown): boolean;

  protected getStringAttributeValue(attributeName: string): string {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      typeof attributeValue === 'string',
      `The value of attribute "${attributeName}" in constraint "${this.constraint.name}" is unexpectedly not of type string`,
    );

    return attributeValue;
  }

  protected getRegexAttributeValue(attributeName: string): RegExp {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      typeof attributeValue === 'string',
      `The value of attribute "${attributeName}" in constraint "${this.constraint.name}" is unexpectedly not of type string`,
    );

    return new RegExp(attributeValue);
  }

  protected getNumericAttributeValue(attributeName: string): number {
    const attributeValue = this.getAttributeValue(attributeName);

    assert(
      typeof attributeValue === 'number',
      `The value of attribute "${attributeName}" in constraint "${this.constraint.name}" is unexpectedly not of type number`,
    );

    return attributeValue;
  }

  protected getBooleanAttributeValue(attributeName: string): boolean {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      typeof attributeValue === 'boolean',
      `The value of attribute "${attributeName}" in constraint "${this.constraint.name}" is unexpectedly not of type boolean`,
    );

    return attributeValue;
  }

  protected getCellRangeAttributeValue(
    attributeName: string,
  ): CellRangeWrapper {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      isCellRange(attributeValue),
      `The value of attribute "${attributeName}" in constraint "${this.constraint.name}" is unexpectedly not of type cell range`,
    );

    return new CellRangeWrapper(attributeValue);
  }

  protected getTextCollectionAttributeValue(
    attributeName: string,
  ): TextValue[] {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      Array.isArray(attributeValue),
      `The value of attribute "${attributeName}" in constraint "${this.constraint.name}" is unexpectedly not of type collection`,
    );
    assert(
      attributeValue.every(isTextValue),
      `Some values of attribute "${attributeName}" in block "${this.constraint.name}" are unexpectedly not of type text`,
    );
    return attributeValue;
  }

  protected getCellRangeCollectionAttributeValue(
    attributeName: string,
  ): CellRangeWrapper[] {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      Array.isArray(attributeValue),
      `The value of attribute "${attributeName}" in constraint "${this.constraint.name}" is unexpectedly not of type collection`,
    );
    assert(
      attributeValue.every(isCellRangeValue),
      `Some values of attribute "${attributeName}" in block "${this.constraint.name}" are unexpectedly not of type cell range`,
    );
    return attributeValue.map(
      (cellRange) => new CellRangeWrapper(cellRange.value),
    );
  }

  protected getValuetypeAssignmentCollectionAttributeValue(
    attributeName: string,
  ): ValuetypeAssignment[] {
    const attributeValue = this.getAttributeValue(attributeName);
    assert(
      Array.isArray(attributeValue),
      `The value of attribute "${attributeName}" in constraint "${this.constraint.name}" is unexpectedly not of type collection`,
    );
    assert(
      attributeValue.every(isValuetypeAssignmentValue),
      `Some values of attribute "${attributeName}" in constraint "${this.constraint.name}" are unexpectedly not of type type-assignment`,
    );

    return attributeValue.map((assignment) => assignment.value);
  }

  private getAttributeValue(attributeName: string): unknown {
    const attribute = this.getAttribute(attributeName);
    if (attribute === undefined) {
      const metaInf = getOrFailBlockMetaInformation(this.constraintType);

      const attributeSpec = metaInf.getAttributeSpecification(attributeName);
      assert(
        attributeSpec !== undefined,
        `Attribute with name "${attributeName}" is not allowed in a constraint of type ${this.constraintType}`,
      );

      const defaultValue = attributeSpec.defaultValue;
      assert(
        defaultValue !== undefined,
        `The block "${this.constraint.name}" of type ${this.constraint.type.name} is missing a required attribute called "${attributeName}"`,
      );

      return defaultValue;
    }
    const attributeValue = attribute.value;

    if (isRuntimeParameter(attributeValue)) {
      return this.runtimeParameters.get(attributeValue.name);
    }
    if (isCollection(attributeValue)) {
      return attributeValue.values;
    }
    const value = attributeValue.value;
    if (isReference(value)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return value.ref!;
    }
    return value;
  }

  protected getAttribute(attributeName: string): Attribute | undefined {
    return this.constraint.body.attributes.find(
      (attribute) => attribute.name === attributeName,
    );
  }

  protected getOrFailAttribute(attributeName: string): Attribute {
    const attribute = this.getAttribute(attributeName);
    assert(
      attribute !== undefined,
      `Attribute with name ${attributeName} was expected to be present in block ${this.constraint.name} of type ${this.constraint.type.name}`,
    );
    return attribute;
  }
}
