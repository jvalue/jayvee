import {
  IntAttributeValue,
  StringAttributeValue,
  isRuntimeParameter,
} from '@jayvee/language-server';

export function getStringAttributeValue(
  attributeValue: StringAttributeValue,
  runtimeParameters: Map<string, string | number | boolean>,
): string {
  if (isRuntimeParameter(attributeValue)) {
    const parameterValue = runtimeParameters.get(attributeValue.name);
    if (typeof parameterValue !== 'string') {
      throw Error(
        `Runtime parameter ${attributeValue.name} is unexpectedly not of type string.`,
      );
    }
    return parameterValue;
  }
  return attributeValue;
}

export function getIntAttributeValue(
  attributeValue: IntAttributeValue,
  runtimeParameters: Map<string, string | number | boolean>,
): number {
  if (isRuntimeParameter(attributeValue)) {
    const parameterValue = runtimeParameters.get(attributeValue.name);
    if (typeof parameterValue !== 'number') {
      throw Error(
        `Runtime parameter ${attributeValue.name} is unexpectedly not of type number.`,
      );
    }
    return parameterValue;
  }
  return attributeValue;
}
