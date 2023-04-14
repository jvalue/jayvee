import { ValidationAcceptor, ValidationChecks } from 'langium';

import {
  BooleanExpression,
  JayveeAstType,
  isBooleanExpression,
  isBooleanLiteral,
} from '../../ast/generated/ast';
import { evaluateExpression } from '../../ast/model-util';
import { JayveeValidator } from '../jayvee-validator';

export class ExpressionValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      BooleanExpression: [this.checkSimplification],
    };
  }

  checkSimplification(
    this: void,
    expression: BooleanExpression,
    accept: ValidationAcceptor,
  ): void {
    if (isBooleanLiteral(expression)) {
      return;
    }
    if (isBooleanExpression(expression.$container)) {
      return;
    }

    const evaluatedExpression = evaluateExpression(expression);
    accept(
      'info',
      `The expression can be simplified to ${evaluatedExpression}`,
      { node: expression },
    );
  }
}
