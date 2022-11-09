import {
  IntAttributeValue,
  StringAttributeValue,
  isIntAttributeValue,
  isRuntimeParameter,
  isStringAttributeValue,
} from '@jayvee/language-server';

export function getStringAttributeValue(
  attribute: StringAttributeValue,
  runtimeParameters: Map<string, string>,
): string {
  if (isRuntimeParameter(attribute)) {
    const value = runtimeParameters.get(attribute.name);
    if (value === undefined) {
      throw new Error(
        `No value was provided for runtime parameter ${attribute.name}`,
      );
    }
    return value;
  }
  if (isStringAttributeValue(attribute)) {
    return attribute.value;
  }
  throw new Error('Unknown kind of attribute');
}

export function getIntAttributeValue(
  attribute: IntAttributeValue,
  runtimeParameters: Map<string, string>,
): number {
  if (isRuntimeParameter(attribute)) {
    const value = runtimeParameters.get(attribute.name);
    if (value === undefined) {
      throw new Error(
        `No value was provided for runtime parameter ${attribute.name}`,
      );
    }
    if (!/^[0-9]+$/.test(value)) {
      throw new Error(
        `The value for runtime parameter ${attribute.name} needs to be an integer`,
      );
    }
    return Number.parseInt(value, 10);
  }
  if (isIntAttributeValue(attribute)) {
    return attribute.value;
  }
  throw new Error('Unknown kind of attribute');
}
