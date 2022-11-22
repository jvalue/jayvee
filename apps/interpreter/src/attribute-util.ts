import {
  IntAttributeValue,
  StringAttributeValue,
  isIntValue,
  isRuntimeParameter,
  isStringValue,
} from '@jayvee/language-server';
import { assertUnreachable } from 'langium/lib/utils/errors';

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
  if (isStringValue(attributeValue)) {
    return attributeValue.value;
  }
  assertUnreachable(attributeValue);
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
  if (isIntValue(attributeValue)) {
    return attributeValue.value;
  }
  assertUnreachable(attributeValue);
}
