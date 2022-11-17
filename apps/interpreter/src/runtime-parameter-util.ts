import {
  Model,
  RuntimeParameter,
  isIntAttributeValue,
  isRuntimeParameter,
  isStringAttributeValue,
} from '@jayvee/language-server';
import { AstNode, isAstNode } from 'langium';

import * as R from './executors/execution-result';

export function extractRequiredRuntimeParameters(
  model: Model,
): RuntimeParameter[] {
  const runtimeParameters: RuntimeParameter[] = [];
  forEachAstNode(model, (node) => {
    for (const value of Object.values(node)) {
      if (isRuntimeParameter(value)) {
        runtimeParameters.push(value);
      }
    }
  });
  return runtimeParameters;
}

export function extractRuntimeParameters(
  requiredParameters: RuntimeParameter[],
  env: Map<string, string>,
): R.Result<Map<string, string | number | boolean>> {
  const parameters: Map<string, string | number | boolean> = new Map();
  const errorMessages: string[] = [];

  for (const requiredParameter of requiredParameters) {
    const parameterValue = env.get(requiredParameter.name);
    if (parameterValue === undefined) {
      errorMessages.push(
        `Runtime parameter ${requiredParameter.name} is missing.`,
      );
      continue;
    }

    const parseResult = getParameterAsMatchingType(
      parameterValue,
      requiredParameter,
    );
    if (R.isErr(parseResult)) {
      errorMessages.push(R.errDetails(parseResult).message);
      continue;
    }

    parameters.set(requiredParameter.name, parameterValue);
  }

  if (errorMessages.length > 0) {
    return R.err({
      message: errorMessages.join('\n'),
      hint: `Please provide values by adding "-e <parameterName>=<value>" to your command.`,
    });
  }

  return R.ok(parameters);
}

function getParameterAsMatchingType(
  value: string,
  requiredParameter: RuntimeParameter,
): R.Result<string | number | boolean> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const requiredType = (requiredParameter.$container as any).value; // TODO: change grammar to have a type guard here.
  if (isStringAttributeValue(requiredType)) {
    return R.ok(value);
  }
  if (isIntAttributeValue(requiredType)) {
    if (!/^[0-9]+$/.test(value)) {
      return R.err({
        message: `Runtime parameter ${
          requiredParameter.name
        } has value ${JSON.stringify(value)} but should be of type integer`,
      });
    }
    return R.ok(Number.parseInt(value, 10));
  }
  throw Error(
    `No support for type of runtime parameter ${requiredParameter.name}`,
  );
}

export function forEachAstNode(
  node: AstNode,
  fn: (value: AstNode) => void,
): void {
  return doForEachAstNode(node, fn, new Map());
}

function doForEachAstNode(
  node: AstNode,
  fn: (value: AstNode) => void,
  visited: Map<AstNode, boolean>,
): void {
  if (visited.get(node) === true) {
    return;
  }
  visited.set(node, true);
  fn(node);

  for (const value of Object.values(node)) {
    if (typeof value === 'object' && isAstNode(value)) {
      doForEachAstNode(value, fn, visited);
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isAstNode(item)) {
          doForEachAstNode(item, fn, visited);
        }
      }
    }
  }
}
