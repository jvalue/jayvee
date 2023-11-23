// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';
import * as path from 'path';
import * as fs from "fs/promises"

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BinaryFile,
  BlockExecutorClass,
  ExecutionContext,
  ExecutionErrorDetails,
  FileExtension,
  MimeType,
  None,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType, PrimitiveValuetypes } from '@jvalue/jayvee-language-server';
import { AstNode } from 'langium';

import {
  inferFileExtensionFromContentTypeString,
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromFileExtensionString,
} from './file-util';
import {
  createBackoffStrategy,
  isBackoffStrategyHandle,
} from './util/backoff-strategy';
import { file } from 'jszip';

@implementsStatic<BlockExecutorClass>()
export class LocalFileExtractorExecutor extends AbstractBlockExecutor<
  IOType.NONE,
  IOType.FILE
> {
  public static readonly type = 'LocalFileExtractor';

  constructor() {
    super(IOType.NONE, IOType.FILE);
  }

  async doExecute(
    input: None,
    context: ExecutionContext,
  ): Promise<R.Result<BinaryFile>> {
    const filePath = context.getPropertyValue('filePath', PrimitiveValuetypes.Text);
    const retries = context.getPropertyValue(
      'retries',
      PrimitiveValuetypes.Integer,
    );
    assert(retries >= 0); // loop executes at least once
    const retryBackoffMilliseconds = context.getPropertyValue(
      'retryBackoffMilliseconds',
      PrimitiveValuetypes.Integer,
    );
    const retryBackoffStrategy = context.getPropertyValue(
      'retryBackoffStrategy',
      PrimitiveValuetypes.Text,
    );
    assert(isBackoffStrategyHandle(retryBackoffStrategy));
    const backoffStrategy = createBackoffStrategy(
      retryBackoffStrategy,
      retryBackoffMilliseconds,
    );

    let failure: ExecutionErrorDetails<AstNode> | undefined;
    for (let attempt = 0; attempt <= retries; ++attempt) {
      const isLastAttempt = attempt === retries;
      const file = await this.fetchRawDataAsFile(filePath, context);

      if (R.isOk(file)) {
        context.logger.logDebug(`Successfully fetched raw data`);
        return R.ok(file.right);
      }

      failure = file.left;

      if (!isLastAttempt) {
        context.logger.logDebug(failure.message);

        const currentBackoff = backoffStrategy.getBackoffMilliseconds(
          attempt + 1,
        );
        context.logger.logDebug(
          `Waiting ${currentBackoff}ms before trying again...`,
        );
        await new Promise((p) => setTimeout(p, currentBackoff));
        continue;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return R.err(failure!);
  }

  private fetchRawDataAsFile(
    filePath: string,
    context: ExecutionContext,
  ): Promise<R.Result<BinaryFile>> {
    context.logger.logDebug(`Fetching raw data from ${filePath}`);
    return new Promise(async (resolve)=>{
        try {
            const rawData = await fs.readFile(filePath)
    
            // Infer FileName and FileExtension from filePath
            const fileName = path.basename(filePath);
            const extName = path.extname(fileName);
            const fileExtension = inferFileExtensionFromFileExtensionString(extName) || FileExtension.NONE;
    
            // Infer Mimetype from FileExtension, if not inferrable, then default to application/octet-stream
            const mimeType: MimeType | undefined = MimeType.APPLICATION_OCTET_STREAM;
    
            // Create file and return file
            const file = new BinaryFile(
            fileName,
            fileExtension,
            mimeType,
            rawData.buffer as ArrayBuffer,
            );
    
            resolve(R.ok(file));
    
        } catch (error: any) {
            resolve(R.err({
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              message: error.message,
              diagnostic: { node: context.getCurrentNode(), property: 'filePath' },
            }));
          }
    })
    }
}