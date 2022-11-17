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
    return runtimeParameters.get(attribute.name) as string; // We checked before execution that it exists!
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
    return runtimeParameters.get(attribute.name) as number; // We checked before execution that it exists!
  }
  throw new Error('Unknown kind of attribute');
}
