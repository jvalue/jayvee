import {
  ValidationAcceptor,
  ValidationChecks,
  ValidationRegistry,
} from 'langium';

// eslint-disable-next-line import/no-cycle
import { getExecutor } from '../cli/interpreter';
import { collectIngoingPipes, collectOutgoingPipes } from '../cli/model-util';

import {
  Block,
  CSVFileExtractor,
  ColumnSection,
  Layout,
  OpenDataLanguageAstType,
  Pipe,
  RowSection,
  isRowSection,
} from './generated/ast';
import type { OpenDataLanguageServices } from './open-data-language-module';

/**
 * Registry for validation checks.
 */
export class OpenDataLanguageValidationRegistry extends ValidationRegistry {
  constructor(services: OpenDataLanguageServices) {
    super(services);
    const validator = services.validation.OpenDataLanguageValidator;
    const checks: ValidationChecks<OpenDataLanguageAstType> = {
      ColumnSection: validator.checkColumnIdFormat,
      RowSection: validator.checkRowIdFormat,
      Layout: validator.checkSingleHeader,
      Pipe: validator.checkBlockCompatibility,
      Block: [validator.checkIngoingPipes, validator.checkOutgoingPipes],
      CSVFileExtractor: validator.checkUrlFormat,
    };
    this.register(checks, validator);
  }
}

/**
 * Implementation of custom validations.
 */
export class OpenDataLanguageValidator {
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

  checkBlockCompatibility(
    this: void,
    pipe: Pipe,
    accept: ValidationAcceptor,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const fromBlock = pipe.from?.ref;
    if (fromBlock === undefined) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const toBlock = pipe.to?.ref;
    if (toBlock === undefined) {
      return;
    }

    const fromBlockExecutor = getExecutor(fromBlock.type);
    const toBlockExecutor = getExecutor(toBlock.type);

    if (!fromBlockExecutor.canExecuteAfter(toBlockExecutor)) {
      accept(
        'error',
        `The output of block ${fromBlock.type.$type} is incompatible with the input of block ${toBlock.type.$type}`,
        {
          node: pipe,
        },
      );
    }
  }

  checkIngoingPipes(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    OpenDataLanguageValidator.checkPipesOfBlock(block, 'input', accept);
  }

  checkOutgoingPipes(
    this: void,
    block: Block,
    accept: ValidationAcceptor,
  ): void {
    OpenDataLanguageValidator.checkPipesOfBlock(block, 'output', accept);
  }

  private static checkPipesOfBlock(
    block: Block,
    whatToCheck: 'input' | 'output',
    accept: ValidationAcceptor,
  ): void {
    const blockExecutor = getExecutor(block.type);

    let pipes: Pipe[];
    switch (whatToCheck) {
      case 'input': {
        pipes = collectIngoingPipes(block);
        break;
      }
      case 'output': {
        pipes = collectOutgoingPipes(block);
        break;
      }
    }

    if (
      (whatToCheck === 'input' && !blockExecutor.hasInput()) ||
      (whatToCheck === 'output' && !blockExecutor.hasOutput())
    ) {
      for (const pipe of pipes) {
        accept(
          'error',
          `Blocks of type ${block.type.$type} do not have an ${whatToCheck}`,
          {
            node: pipe,
            property: 'from',
          },
        );
      }
    } else if (pipes.length > 1) {
      for (const pipe of pipes) {
        accept(
          'error',
          `At most one pipe can connect to the ${whatToCheck} of a ${block.type.$type}`,
          {
            node: pipe,
            property: 'from',
          },
        );
      }
    } else if (pipes.length === 0) {
      accept(
        'warning',
        `A pipe should be connected to the ${whatToCheck} of this block`,
        {
          node: block,
        },
      );
    }
  }

  checkUrlFormat(
    this: void,
    csvFileExtractor: CSVFileExtractor,
    accept: ValidationAcceptor,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const url: string = csvFileExtractor?.url;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (url === undefined) {
      return;
    }

    const urlRegex =
      /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;
    if (!urlRegex.test(url)) {
      accept('warning', 'The url has an invalid format', {
        node: csvFileExtractor,
        property: 'url',
      });
    }
  }
}
