import { strict as assert } from 'assert';

import { Logger } from '@jayvee/execution';
import * as R from '@jayvee/execution';
import {
  AttributeType,
  Model,
  RuntimeParameter,
  getOrFailMetaInformation,
  isRuntimeParameter,
} from '@jayvee/language-server';
import { streamAst } from 'langium';
import { assertUnreachable } from 'langium/lib/utils/errors';

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
 * @param logger the logger that shall be used for logging
 * @returns all runtime parameters stored as a map if all required ones are present
 */
export function extractRuntimeParameters(
  requiredParameters: RuntimeParameter[],
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

    const parseResult = parseParameterAsMatchingType(
      parameterValue,
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
  const metaInf = getOrFailMetaInformation(block.type);
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
          diagnostic: { node: requiredParameter },
        });
      }
      return R.ok(Number.parseInt(value, 10));
    default:
      assert(
        requiredType !== AttributeType.CELL_RANGE,
        'Runtime parameters are not allowed for attributes of type cell-range',
      );
      assert(
        requiredType !== AttributeType.CELL_RANGE_COLLECTION,
        'Runtime parameters are not allowed for attributes of type cell-range-array',
      );
      assert(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        requiredType !== AttributeType.LAYOUT,
        'Runtime parameters are not allowed for attributes of type layout',
      );

      assertUnreachable(requiredType);
  }
}
