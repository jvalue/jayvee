import { strict as assert } from 'assert';

import {
  AttributeType,
  Model,
  RuntimeParameter,
  getMetaInformation,
  isRuntimeParameter,
} from '@jayvee/language-server';
import * as E from 'fp-ts/lib/Either';
import { streamAst } from 'langium';
import { assertUnreachable } from 'langium/lib/utils/errors';

import * as R from './executors/utils/execution-result';

/**
 * Extracts all required runtime parameter ast nodes.
 * @param model The @see Model ast node
 * @returns a list of @see RuntimeParameter
 */
export function extractRequiredRuntimeParameters(
  model: Model,
): RuntimeParameter[] {
  const runtimeParameters: RuntimeParameter[] = [];
  streamAst(model).forEach((node) => {
    if (isRuntimeParameter(node)) {
      runtimeParameters.push(node);
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
): E.Either<R.ExecutionErrorDetails[], Map<string, string | number | boolean>> {
  const parameters: Map<string, string | number | boolean> = new Map();
  const errorMessages: R.ExecutionErrorDetails[] = [];

  for (const requiredParameter of requiredParameters) {
    const parameterValue = env.get(requiredParameter.name);
    if (parameterValue === undefined) {
      errorMessages.push({
        message: `Runtime parameter ${requiredParameter.name} is missing.`,
        hint: `Please provide values by adding "-e <parameterName>=<value>" to your command.`,
        cstNode: requiredParameter.$container.$cstNode,
      });
      continue;
    }

    const parseResult = parseParameterAsMatchingType(
      parameterValue,
      requiredParameter,
    );
    if (R.isErr(parseResult)) {
      errorMessages.push(R.errDetails(parseResult));
      continue;
    }

    parameters.set(requiredParameter.name, parseResult.right);
  }

  if (errorMessages.length > 0) {
    return E.left(errorMessages);
  }

  return E.right(parameters);
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
  const block = requiredParameter.$container.$container;
  const metaInf = getMetaInformation(block.type);
  const attributeName = requiredParameter.$container.name;

  const attributeSpec = metaInf.getAttributeSpecification(attributeName);
  assert(
    attributeSpec !== undefined,
    `Attribute with name "${attributeName}" is not allowed in a block of type ${block.type}`,
  );

  const requiredType = attributeSpec.type;

  switch (requiredType) {
    case AttributeType.STRING:
      return R.ok(value);
    case AttributeType.INT:
      if (!/^[1-9][0-9]*$/.test(value)) {
        return R.err({
          message: `Runtime parameter ${
            requiredParameter.name
          } has value ${JSON.stringify(value)} but should be of type integer.`,
          hint: 'Use an integer value instead.',
          cstNode: requiredParameter.$container.$cstNode,
        });
      }
      return R.ok(Number.parseInt(value, 10));
    default:
      assert(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        requiredType !== AttributeType.LAYOUT,
        'Runtime parameters are not allowed for attributes of type layout',
      );

      assertUnreachable(requiredType);
  }
}
