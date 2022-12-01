import { ValidationAcceptor, ValidationChecks } from 'langium';

import {
  ColumnSection,
  HeaderRowSection,
  JayveeAstType,
  Layout,
  isHeaderRowSection,
} from '../ast/generated/ast';

import { JayveeValidator } from './jayvee-validator';

export class LayoutValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      ColumnSection: this.checkColumnIdFormat,
      HeaderRowSection: this.checkRowIdFormat,
      Layout: this.checkSingleHeader,
    };
  }

  checkSingleHeader(
    this: void,
    layout: Layout,
    accept: ValidationAcceptor,
  ): void {
    const headerRowSections: HeaderRowSection[] =
      layout.sections.filter(isHeaderRowSection);
    if (headerRowSections.length > 1) {
      for (const headerRowSection of headerRowSections) {
        accept('error', `At most a single header row can be defined`, {
          node: headerRowSection,
          keyword: 'header',
        });
      }
    }
  }

  checkColumnIdFormat(
    this: void,
    columnSection: ColumnSection,
    accept: ValidationAcceptor,
  ): void {
    const columnIdFormat = /^[A-Z]+$/;
    if (!columnIdFormat.test(columnSection.columnId)) {
      accept('error', `Column identifiers need to consist of capital letters`, {
        node: columnSection,
        property: 'columnId',
      });
    }
  }

  checkRowIdFormat(
    this: void,
    rowSection: HeaderRowSection,
    accept: ValidationAcceptor,
  ): void {
    if (rowSection.rowId <= 0) {
      accept('error', `Column identifiers need to be positive integers`, {
        node: rowSection,
        property: 'rowId',
      });
    }
  }
}
