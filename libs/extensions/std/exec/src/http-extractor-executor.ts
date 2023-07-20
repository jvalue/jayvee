// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

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
  inferMimeTypeFromContentTypeString,
} from './file-util';
import {
  BackoffStrategy,
  LinearBackoffStrategy,
} from './util/backoff-strategy';

type HttpGetFunction = typeof http.get;

@implementsStatic<BlockExecutorClass>()
export class HttpExtractorExecutor extends AbstractBlockExecutor<
  IOType.NONE,
  IOType.FILE
> {
  public static readonly type = 'HttpExtractor';

  constructor() {
    super(IOType.NONE, IOType.FILE);
  }

  async doExecute(
    input: None,
    context: ExecutionContext,
  ): Promise<R.Result<BinaryFile>> {
    const url = context.getPropertyValue('url', PrimitiveValuetypes.Text);
    const retries = context.getPropertyValue(
      'retries',
      PrimitiveValuetypes.Integer,
    );
    const retryBackoff = context.getPropertyValue(
      'retryBackoffMilliseconds',
      PrimitiveValuetypes.Integer,
    );
    const backoffStrategy: BackoffStrategy = new LinearBackoffStrategy(
      retryBackoff,
    );

    let failure: ExecutionErrorDetails<AstNode> | undefined;
    assert(retries >= 0); // loop executes at least once
    for (let attempt = 0; attempt <= retries; ++attempt) {
      const isLastAttempt = attempt === retries;
      const file = await this.fetchRawDataAsFile(url, context);

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
    url: string,
    context: ExecutionContext,
  ): Promise<R.Result<BinaryFile>> {
    context.logger.logDebug(`Fetching raw data from ${url}`);
    let httpGetFunction: HttpGetFunction;
    if (url.startsWith('https')) {
      httpGetFunction = https.get;
    } else {
      httpGetFunction = http.get;
    }
    return new Promise((resolve) => {
      httpGetFunction(url, (response) => {
        const responseCode = response.statusCode;

        // Catch errors
        if (responseCode === undefined || responseCode >= 400) {
          resolve(
            R.err({
              message: `HTTP fetch failed with code ${
                responseCode ?? 'undefined'
              }. Please check your connection.`,
              diagnostic: { node: context.getOrFailProperty('url') },
            }),
          );
        }

        // Get chunked data and store to ArrayBuffer
        let rawData = new Uint8Array(0);
        response.on('data', (chunk: Buffer) => {
          const tmp = new Uint8Array(rawData.length + chunk.length);
          tmp.set(rawData, 0);
          tmp.set(chunk, rawData.length);
          rawData = tmp;
        });

        // When all data is downloaded, create file
        response.on('end', () => {
          response.headers;

          // Infer Mimetype from HTTP-Header, if not inferrable, then default to application/octet-stream
          const mimeType: MimeType | undefined =
            inferMimeTypeFromContentTypeString(
              response.headers['content-type'],
            ) || MimeType.APPLICATION_OCTET_STREAM;

          // Infer FileName and FileExtension from url, if not inferrable, then default to None
          // Get last element of URL assuming this is a filename
          const urlString = context.getPropertyValue(
            'url',
            PrimitiveValuetypes.Text,
          );
          const url = new URL(urlString);
          let fileName = url.pathname.split('/').pop();
          if (fileName === undefined) {
            fileName = url.pathname.replace('/', '-');
          }
          const extName = path.extname(fileName);
          let fileExtension =
            inferFileExtensionFromFileExtensionString(extName) ||
            FileExtension.NONE;

          // If FileExtension is not in url, try to infer extension from content-type, if not inferrable, then default to None
          if (fileExtension === FileExtension.NONE) {
            fileExtension =
              inferFileExtensionFromContentTypeString(
                response.headers['content-type'],
              ) || FileExtension.NONE;
          }

          // Create file and return file
          const file = new BinaryFile(
            fileName,
            fileExtension,
            mimeType,
            rawData.buffer as ArrayBuffer,
          );
          resolve(R.ok(file));
        });

        response.on('error', (errorObj) => {
          resolve(
            R.err({
              message: errorObj.message,
              diagnostic: { node: context.getCurrentNode(), property: 'name' },
            }),
          );
        });
      });
    });
  }
}
