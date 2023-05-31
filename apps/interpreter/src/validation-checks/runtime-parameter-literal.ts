// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockTypeLiteral,
  ConstraintTypeLiteral,
  EvaluationContext,
  RuntimeParameterLiteral,
  ValidationContext,
  getMetaInformation,
} from '@jvalue/jayvee-language-server';

export function validateRuntimeParameterLiteral(
  runtimeParameter: RuntimeParameterLiteral,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  checkRuntimeParameterValuePresence(
    runtimeParameter,
    validationContext,
    evaluationContext,
  );
  if (validationContext.hasErrorOccurred()) {
    return;
  }

  checkRuntimeParameterValueParsing(
    runtimeParameter,
    validationContext,
    evaluationContext,
  );
}

function checkRuntimeParameterValuePresence(
  runtimeParameter: RuntimeParameterLiteral,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const runtimeParameterName = runtimeParameter?.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (runtimeParameterName === undefined) {
    return;
  }

  if (!evaluationContext.hasValueForRuntimeParameter(runtimeParameterName)) {
    validationContext.accept(
      'error',
      `A value needs to be provided by adding "-e ${runtimeParameterName}=<value>" to the command.`,
      { node: runtimeParameter },
    );
  }
}

function checkRuntimeParameterValueParsing(
  runtimeParameter: RuntimeParameterLiteral,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
) {
  const containerType: BlockTypeLiteral | ConstraintTypeLiteral | undefined =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    runtimeParameter.$container.$container.$container?.type;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const propertyName = runtimeParameter.$container?.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (propertyName === undefined) {
    return;
  }

  const metaInf = getMetaInformation(containerType);
  const propertySpec = metaInf?.getPropertySpecification(propertyName);
  if (propertySpec === undefined) {
    return;
  }

  const valuetype = propertySpec.type;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const runtimeParameterName = runtimeParameter?.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (runtimeParameterName === undefined) {
    return;
  }

  const runtimeParameterValue = evaluationContext.getValueForRuntimeParameter(
    runtimeParameterName,
    valuetype,
  );
  if (runtimeParameterValue === undefined) {
    const rawValue =
      evaluationContext.runtimeParameterProvider.getRawValue(
        runtimeParameterName,
      );
    validationContext.accept(
      'error',
      `Unable to parse the value "${
        rawValue ?? ''
      }" as ${valuetype.getName()}.`,
      { node: runtimeParameter },
    );
  }
}
