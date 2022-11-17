import {
  Model,
  RuntimeParameter,
  isIntAttribute,
  isRuntimeParameter,
  isStringAttribute,
} from '@jayvee/language-server';
import { AstNode, isAstNode } from 'langium';

import * as R from './executors/execution-result';

/**
 * Extracts all required runtime parameter ast nodes.
 * @param model The @see Model ast node
 * @returns a list of @see RuntimeParameter
 */
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

/**
 * Creates a map with all the runtime parameter values.
 * @param requiredParameters A list of all required runtime parameters, e.g. by @see extractRequiredRuntimeParameters
 * @param env The environment variable map
 * @returns all runtime parameters stored as a map if all required ones are present, error details if not
 */
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

    const parseResult = parseParameterAsMatchingType(
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

/**
 * Parses a runtime parameter value to the required type.
 * @param value The string value to be parsed.
 * @param requiredParameter The ast node representing the parameter. Used to extract the desired parameter type.
 * @returns the parsed parameter value if parseable, error details if not.
 */
function parseParameterAsMatchingType(
  value: string,
  requiredParameter: RuntimeParameter,
): R.Result<string | number | boolean> {
  const requiredType = requiredParameter.$container;
  if (isStringAttribute(requiredType)) {
    return R.ok(value);
  }
  if (isIntAttribute(requiredType)) {
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

/**
 * Executes function on every ast node.
 * @param node The ast node where to start.
 * @param fn The function to execute on every ast node.
 */
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
