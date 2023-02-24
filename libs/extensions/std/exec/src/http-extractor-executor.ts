import * as https from 'https';
import * as path from 'path';

import * as R from '@jayvee/execution';
import {
  BlockExecutor,
  File,
  FileExtension,
  MimeType,
} from '@jayvee/execution';
import { IOType } from '@jayvee/language-server';

import {
  inferFileExtensionFromContentTypeString,
  inferFileExtensionFromFileExtensionString,
  inferMimeTypeFromContentTypeString,
} from './file-util';

export class HttpExtractorExecutor extends BlockExecutor<
  IOType.NONE,
  IOType.FILE
> {
  constructor() {
    super('HttpExtractor', IOType.NONE, IOType.FILE);
  }

  override async execute(): Promise<R.Result<File>> {
    // Accessing attribute values by their name:
    const url = this.getStringAttributeValue('url');

    const file = await this.fetchRawDataAsFile(url);

    if (R.isErr(file)) {
      return file;
    }

    return R.ok(file.right);
  }

  private fetchRawDataAsFile(url: string): Promise<R.Result<File>> {
    this.logger.logDebug(`Fetching raw data from ${url}`);
    return new Promise((resolve) => {
      https.get(url, (response) => {
        const responseCode = response.statusCode;

        // Catch errors
        if (responseCode === undefined || responseCode >= 400) {
          resolve(
            R.err({
              message: `HTTP fetch failed with code ${
                responseCode ?? 'undefined'
              }. Please check your connection.`,
              diagnostic: { node: this.getOrFailAttribute('url') },
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
          this.logger.logDebug(`Successfully fetched raw data`);
          response.headers;

          // Infer Mimetype from HTTP-Header, if not inferrable, then default to application/octet-stream
          const mimeType: MimeType | undefined =
            inferMimeTypeFromContentTypeString(
              response.headers['content-type'],
            ) || MimeType.APPLICATION_OCTET_STREAM;

          // Infer FileName and FileExtension from url, if not inferrable, then default to None
          // Get last element of URL assuming this is a filename
          const url = new URL(this.getStringAttributeValue('url'));
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
          const file: File = {
            ioType: IOType.FILE,
            name: fileName,
            extension: fileExtension,
            content: rawData.buffer as ArrayBuffer,
            mimeType: mimeType,
          };
          resolve(R.ok(file));
        });

        response.on('error', (errorObj) => {
          resolve(
            R.err({
              message: errorObj.message,
              diagnostic: { node: this.block, property: 'name' },
            }),
          );
        });
      });
    });
  }
}
