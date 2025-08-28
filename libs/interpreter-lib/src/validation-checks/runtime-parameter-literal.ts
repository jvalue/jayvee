// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  ERROR_TYPEGUARD,
  type JayveeValidationProps,
  type PropertyBody,
  type ReferenceableBlockTypeDefinition,
  type RuntimeParameterLiteral,
} from '@jvalue/jayvee-language-server';
import { type Reference } from 'langium';

export function validateRuntimeParameterLiteral(
  runtimeParameter: RuntimeParameterLiteral,
  props: JayveeValidationProps,
) {
  checkRuntimeParameterValuePresence(runtimeParameter, props);
  if (props.validationContext.hasErrorOccurred()) {
    return;
  }

  checkRuntimeParameterValueParsing(runtimeParameter, props);
}

function checkRuntimeParameterValuePresence(
  runtimeParameter: RuntimeParameterLiteral,
  props: JayveeValidationProps,
) {
  const runtimeParameterName = runtimeParameter?.name;

  if (runtimeParameterName === undefined) {
    return;
  }

  if (
    !props.evaluationContext.hasValueForRuntimeParameter(runtimeParameterName)
  ) {
    props.validationContext.accept(
      'error',
      `A value needs to be provided by adding "-e ${runtimeParameterName}=<value>" to the command.`,
      { node: runtimeParameter },
    );
  }
}

function checkRuntimeParameterValueParsing(
  runtimeParameter: RuntimeParameterLiteral,
  props: JayveeValidationProps,
) {
  const enclosingPropertyBody = getEnclosingPropertyBody(runtimeParameter);
  const type: Reference<ReferenceableBlockTypeDefinition> | undefined =
    enclosingPropertyBody.$container.type;
  const wrapper =
    type !== undefined
      ? props.wrapperFactories.BlockType.wrap(type)
      : undefined;

  const propertyName = runtimeParameter.$container?.name;

  if (propertyName === undefined) {
    return;
  }

  const propertySpec = wrapper?.getPropertySpecification(propertyName);
  if (propertySpec === undefined) {
    return;
  }

  const valueType = propertySpec.type;

  const runtimeParameterName = runtimeParameter?.name;

  if (runtimeParameterName === undefined) {
    return;
  }

  const runtimeParameterValue =
    props.evaluationContext.getValueForRuntimeParameter(
      runtimeParameterName,
      valueType,
    );
  if (ERROR_TYPEGUARD(runtimeParameterValue)) {
    props.validationContext.accept('error', runtimeParameterValue.toString(), {
      node: runtimeParameter,
    });
  }
}

function getEnclosingPropertyBody(
  runtimeParameter: RuntimeParameterLiteral,
): PropertyBody {
  return runtimeParameter.$container.$container;
}
