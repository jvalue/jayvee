import { ValidationAcceptor, ValidationChecks } from 'langium';

// eslint-disable-next-line import/no-cycle
import { ColumnSection, Layout, RowSection, isRowSection } from '..';
import { JayveeAstType } from '../ast/generated/ast';

import { JayveeValidator } from './jayvee-validator';

export class LayoutValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      ColumnSection: this.checkColumnIdFormat,
      RowSection: this.checkRowIdFormat,
      Layout: this.checkSingleHeader,
    };
  }

  checkSingleHeader(
    this: void,
    layout: Layout,
    accept: ValidationAcceptor,
  ): void {
    const headerRowSections: RowSection[] = [];
    for (const section of layout.sections) {
      if (isRowSection(section) && section.header) {
        headerRowSections.push(section);
      }
    }
    if (headerRowSections.length > 1) {
      for (const headerRowSection of headerRowSections) {
        accept('error', `At most a single row can be marked as header`, {
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
    rowSection: RowSection,
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
