// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationRegistry } from 'langium';

import type { JayveeServices } from '../jayvee-module';

/**
 * Registry for validation checks.
 */
export class JayveeValidationRegistry extends ValidationRegistry {
  constructor(services: JayveeServices) {
    super(services);

    const modelValidator = services.validation.JayveeModelValidator;
    this.register(modelValidator.checks, modelValidator);

    const pipelineValidator = services.validation.PipelineDefinitionValidator;
    this.register(pipelineValidator.checks, pipelineValidator);

    const pipeValidator = services.validation.PipeValidator;
    this.register(pipeValidator.checks, pipeValidator);

    const blockValidator = services.validation.BlockValidator;
    this.register(blockValidator.checks, blockValidator);

    const propertyBodyValidator = services.validation.PropertyBodyValidator;
    this.register(propertyBodyValidator.checks, propertyBodyValidator);

    const cellRangeSelectionValidator =
      services.validation.CellRangeSelectionValidator;
    this.register(
      cellRangeSelectionValidator.checks,
      cellRangeSelectionValidator,
    );

    const columnExpressionValidator =
      services.validation.ColumnExpressionValidator;
    this.register(columnExpressionValidator.checks, columnExpressionValidator);

    const regexValueValidator = services.validation.RegexValueValidator;
    this.register(regexValueValidator.checks, regexValueValidator);

    const constraintValidator = services.validation.ConstraintValidator;
    this.register(constraintValidator.checks, constraintValidator);

    const valuetypeValidator = services.validation.ValuetypeValidator;
    this.register(valuetypeValidator.checks, valuetypeValidator);

    const expressionValidator = services.validation.ExpressionValidator;
    this.register(expressionValidator.checks, expressionValidator);
  }
}
