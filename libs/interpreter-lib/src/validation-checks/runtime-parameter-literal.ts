// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BuiltinConstrainttypeDefinition,
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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const runtimeParameterName = runtimeParameter?.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
  const type:
    | Reference<ReferenceableBlockTypeDefinition>
    | Reference<BuiltinConstrainttypeDefinition>
    | undefined =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    enclosingPropertyBody.$container?.type;
  const wrapper = props.wrapperFactories.TypedObject.wrap(type);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const propertyName = runtimeParameter.$container?.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (propertyName === undefined) {
    return;
  }

  const propertySpec = wrapper?.getPropertySpecification(propertyName);
  if (propertySpec === undefined) {
    return;
  }

  const valueType = propertySpec.type;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const runtimeParameterName = runtimeParameter?.name;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (runtimeParameterName === undefined) {
    return;
  }

  const runtimeParameterValue =
    props.evaluationContext.getValueForRuntimeParameter(
      runtimeParameterName,
      valueType,
    );
  if (runtimeParameterValue === undefined) {
    const rawValue =
      props.evaluationContext.runtimeParameterProvider.getRawValue(
        runtimeParameterName,
      );
    props.validationContext.accept(
      'error',
      `Unable to parse the value "${
        rawValue ?? ''
      }" as ${valueType.getName()}.`,
      { node: runtimeParameter },
    );
  }
}

function getEnclosingPropertyBody(
  runtimeParameter: RuntimeParameterLiteral,
): PropertyBody {
  return runtimeParameter.$container.$container;
}
