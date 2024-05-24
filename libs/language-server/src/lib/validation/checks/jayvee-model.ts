// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstUtils } from 'langium';

import {
  type JayveeModel,
  isBuiltinConstrainttypeDefinition,
  isConstraintDefinition,
  isIotypeDefinition,
  isPipelineDefinition,
  isReferenceableBlockTypeDefinition,
  isTransformDefinition,
  isValuetypeDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';
import { checkUniqueNames } from '../validation-util';

export function validateJayveeModel(
  model: JayveeModel,
  props: JayveeValidationProps,
): void {
  const allElements = AstUtils.streamAllContents(model);

  checkUniqueNames(
    [...allElements.filter(isPipelineDefinition)],
    props.validationContext,
  );
  checkUniqueNames(
    [...allElements.filter(isTransformDefinition)],
    props.validationContext,
  );
  checkUniqueNames(
    [...allElements.filter(isValuetypeDefinition)],
    props.validationContext,
  );
  checkUniqueNames(
    [...allElements.filter(isConstraintDefinition)],
    props.validationContext,
  );
  checkUniqueNames(
    [...allElements.filter(isReferenceableBlockTypeDefinition)],
    props.validationContext,
  );
  checkUniqueNames(
    [...allElements.filter(isBuiltinConstrainttypeDefinition)],
    props.validationContext,
  );
  checkUniqueNames(
    [...allElements.filter(isIotypeDefinition)],
    props.validationContext,
  );
}
