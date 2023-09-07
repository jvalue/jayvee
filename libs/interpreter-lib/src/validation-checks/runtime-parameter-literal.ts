// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  BuiltinConstrainttypeDefinition,
  EvaluationContext,
  MetaInformation,
  PropertyBody,
  ReferenceableBlocktypeDefinition,
  RuntimeParameterLiteral,
  ValidationContext,
  getConstraintMetaInf,
  isBuiltinConstrainttypeDefinition,
  isReferenceableBlocktypeDefinition,
} from '@jvalue/jayvee-language-server';
import { Reference } from 'langium';

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
  const enclosingPropertyBody = getEnclosingPropertyBody(runtimeParameter);
  const type:
    | Reference<ReferenceableBlocktypeDefinition>
    | Reference<BuiltinConstrainttypeDefinition>
    | undefined =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    enclosingPropertyBody.$container?.type;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const propertyName = runtimeParameter.$container?.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (propertyName === undefined) {
    return;
  }

  let metaInf: MetaInformation | undefined;
  if (
    isReferenceableBlocktypeDefinition(type.ref) &&
    BlockMetaInformation.canBeWrapped(type.ref)
  ) {
    metaInf = new BlockMetaInformation(type.ref);
  } else if (isBuiltinConstrainttypeDefinition(type.ref)) {
    metaInf = getConstraintMetaInf(type.ref);
  }

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

function getEnclosingPropertyBody(
  runtimeParameter: RuntimeParameterLiteral,
): PropertyBody {
  return runtimeParameter.$container.$container;
}
