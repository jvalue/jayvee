// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ValidationAcceptor, ValidationChecks } from 'langium';

import { ConstraintDefinition, JayveeAstType } from '../../ast';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { JayveeValidator } from '../jayvee-validator';

export class ConstraintValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      ConstraintDefinition: [this.checkConstraintType],
    };
  }

  checkConstraintType(
    this: void,
    constraint: ConstraintDefinition,
    accept: ValidationAcceptor,
  ): void {
    const metaInf = getMetaInformation(constraint.type);
    if (metaInf === undefined) {
      accept(
        'error',
        `Unknown constraint type '${constraint.type.name ?? ''}'`,
        {
          node: constraint,
          property: 'type',
        },
      );
    }
  }
}
