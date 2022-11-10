import {
  IntAttributeValue,
  RuntimeParameter,
  StringAttributeValue,
  isIntValue,
  isRuntimeParameter,
  isStringValue,
} from '@jayvee/language-server';

import * as R from './executors/execution-result';

export function getStringAttributeValue(
  attribute: StringAttributeValue,
  runtimeParameters: Map<string, string>,
): R.Result<string> {
  if (isStringValue(attribute)) {
    return R.ok(attribute.value);
  }
  if (isRuntimeParameter(attribute)) {
    return getRuntimeParameter(attribute, runtimeParameters);
  }
  throw new Error('Unknown kind of attribute');
}

export function getIntAttributeValue(
  attribute: IntAttributeValue,
  runtimeParameters: Map<string, string>,
): R.Result<number> {
  if (isIntValue(attribute)) {
    return R.ok(attribute.value);
  }
  if (isRuntimeParameter(attribute)) {
    const valueResult = getRuntimeParameter(attribute, runtimeParameters);
    if (R.isErr(valueResult)) {
      return valueResult;
    }
    const value = R.okData(valueResult);
    if (!/^[0-9]+$/.test(value)) {
      return R.err({
        message: `The value for runtime parameter ${attribute.name} needs to be an integer.`,
        hint: `Please provide an integer value by using "-e ${attribute.name}=<integer>" in your command.`,
        cstNode: attribute.$cstNode,
      });
    }
    return R.ok(Number.parseInt(value, 10));
  }
  throw new Error('Unknown kind of attribute');
}

function getRuntimeParameter(
  runtimeParameter: RuntimeParameter,
  runtimeParameters: Map<string, string>,
): R.Result<string> {
  const value = runtimeParameters.get(runtimeParameter.name);
  if (value === undefined) {
    return R.err({
      message: `No value was provided for runtime parameter ${runtimeParameter.name}.`,
      hint: `Please provide a value by adding "-e ${runtimeParameter.name}=<value>" to your command.`,
      cstNode: runtimeParameter.$cstNode,
    });
  }
  return R.ok(value);
}
