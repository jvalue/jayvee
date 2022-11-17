import {
  IntAttributeValue,
  StringAttributeValue,
  isIntValue,
  isRuntimeParameter,
  isStringValue,
} from '@jayvee/language-server';

export function getStringAttributeValue(
  attribute: StringAttributeValue,
  runtimeParameters: Map<string, string | number | boolean>,
): string {
  if (isStringValue(attribute)) {
    return attribute.value;
  }
  if (isRuntimeParameter(attribute)) {
    const parameterValue = runtimeParameters.get(attribute.name);
    if (typeof parameterValue !== 'string') {
      throw Error(
        `Runtime parameter ${attribute.name} is unexpectedly not of type string.`,
      );
    }
    return parameterValue;
  }
  throw new Error('Unknown kind of attribute');
}

export function getIntAttributeValue(
  attribute: IntAttributeValue,
  runtimeParameters: Map<string, string | number | boolean>,
): number {
  if (isIntValue(attribute)) {
    return attribute.value;
  }
  if (isRuntimeParameter(attribute)) {
    const parameterValue = runtimeParameters.get(attribute.name);
    if (typeof parameterValue !== 'number') {
      throw Error(
        `Runtime parameter ${attribute.name} is unexpectedly not of type number.`,
      );
    }
    return parameterValue;
  }
  throw new Error('Unknown kind of attribute');
}
