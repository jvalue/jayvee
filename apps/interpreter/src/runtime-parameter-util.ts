// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import { Logger } from '@jvalue/jayvee-execution';
import {
  BlockTypeLiteral,
  ConstraintTypeLiteral,
  JayveeModel,
  PropertyValuetype,
  RuntimeParameterLiteral,
  getOrFailMetaInformation,
  isRuntimeParameterLiteral,
  runtimeParameterAllowedForType,
} from '@jvalue/jayvee-language-server';
import { streamAst } from 'langium';

/**
 * Extracts all required runtime parameter ast nodes.
 * @param model The @see JayveeModel ast node
 * @returns a list of @see RuntimeParameterLiteral
 */
export function extractRequiredRuntimeParameters(
  model: JayveeModel,
): RuntimeParameterLiteral[] {
  const runtimeParameters: RuntimeParameterLiteral[] = [];
  streamAst(model).forEach((node) => {
    if (isRuntimeParameterLiteral(node)) {
      runtimeParameters.push(node);
    }
  });
  return runtimeParameters;
}

/**
 * Creates a map with all the runtime parameter values.
 * @param requiredParameters A list of all required runtime parameters, e.g. by @see extractRequiredRuntimeParameters
 * @param env The environment variable map
 * @param logger the logger that shall be used for logging
 * @returns all runtime parameters stored as a map if all required ones are present
 */
export function extractRuntimeParameters(
  requiredParameters: RuntimeParameterLiteral[],
  env: Map<string, string>,
  logger: Logger,
): Map<string, string | number | boolean> | undefined {
  let errorCount = 0;
  const parameters: Map<string, string | number | boolean> = new Map();

  for (const requiredParameter of requiredParameters) {
    const parameterValue = env.get(requiredParameter.name);
    if (parameterValue === undefined) {
      logger.logErrDiagnostic(
        `Runtime parameter ${requiredParameter.name} is missing. Please provide a value by adding "-e ${requiredParameter.name}=<value>" to your command.`,
        { node: requiredParameter },
      );
      ++errorCount;
      continue;
    }

    const type: BlockTypeLiteral | ConstraintTypeLiteral =
      requiredParameter.$container.$container.$container.type;
    const metaInf = getOrFailMetaInformation(type);
    const propertyName = requiredParameter.$container.name;

    const propertySpec = metaInf.getPropertySpecification(propertyName);
    assert(
      propertySpec !== undefined,
      `Property with name "${propertyName}" is not allowed in ${type.name}`,
    );

    const parseResult = parseParameterAsMatchingType(
      parameterValue,
      propertySpec.type,
      requiredParameter,
    );
    if (R.isErr(parseResult)) {
      logger.logErrDiagnostic(
        parseResult.left.message,
        parseResult.left.diagnostic,
      );
      continue;
    }

    parameters.set(requiredParameter.name, parseResult.right);
  }

  if (errorCount > 0) {
    return undefined;
  }

  return parameters;
}

const TRUE = 'true';
const FALSE = 'false';

/**
 * Parses a runtime parameter value to the required type.
 * @param value The string value to be parsed.
 * @param type The type according to which the value is parsed.
 * @param astNode The ast node representing the parameter. Used for the diagnostics in case of errors.
 * @returns the parsed parameter value if parseable, error details if not.
 */
export function parseParameterAsMatchingType(
  value: string,
  type: PropertyValuetype,
  astNode: RuntimeParameterLiteral,
): R.Result<string | number | boolean> {
  assert(
    runtimeParameterAllowedForType(type),
    `Runtime parameters of type ${type} are not allowed`,
  );

  switch (type) {
    case PropertyValuetype.TEXT:
      return R.ok(value);
    case PropertyValuetype.INTEGER:
      if (!/^[+-]?[1-9][0-9]*$/.test(value)) {
        return R.err({
          message: `Runtime parameter ${astNode.name} has value "${value}" which is not of type integer.`,
          diagnostic: { node: astNode },
        });
      }
      return R.ok(Number.parseInt(value, 10));
    case PropertyValuetype.DECIMAL:
      if (!/^[+-]?[0-9]+(\.[0-9]+)?$/.test(value)) {
        return R.err({
          message: `Runtime parameter ${astNode.name} has value "${value}" which is not of type decimal.`,
          diagnostic: { node: astNode },
        });
      }
      return R.ok(Number.parseFloat(value));
    case PropertyValuetype.BOOLEAN:
      if (value === TRUE) {
        return R.ok(true);
      }
      if (value === FALSE) {
        return R.ok(false);
      }
      return R.err({
        message: `Runtime parameter ${astNode.name} has value "${value}" which is not of type boolean. Expected "${TRUE}" or "${FALSE}".`,
        diagnostic: { node: astNode },
      });
    default:
      throw new Error(
        `Unable to parse runtime parameters of type ${type}, please provide an implementation.`,
      );
  }
}
