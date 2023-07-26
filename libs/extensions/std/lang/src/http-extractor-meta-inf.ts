// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
  evaluatePropertyValue,
} from '@jvalue/jayvee-language-server';

export class HttpExtractorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'HttpExtractor',

      // Property definitions:
      {
        url: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description: 'The URL to the file in the web to extract.',
            examples: [
              {
                code: 'url: "tinyurl.com/4ub9spwz"',
                description: 'Specifies the URL to fetch the data from.',
              },
            ],
          },
        },
        retries: {
          type: PrimitiveValuetypes.Integer,
          defaultValue: 0,
          docs: {
            description:
              'Configures how many retries should be executed after a failure fetching the data.',
            examples: [
              {
                code: 'retries: 3',
                description:
                  'Executes up to 3 retries if the original retry fails (so in total max. 4 requests).',
              },
            ],
          },
          validation: (property, validationContext, evaluationContext) => {
            const encodingValue = evaluatePropertyValue(
              property,
              evaluationContext,
              PrimitiveValuetypes.Integer,
            );
            if (encodingValue === undefined) {
              return;
            }

            if (encodingValue < 0) {
              validationContext.accept(
                'error',
                'Only not negative integers allowed',
                {
                  node: property,
                  property: 'value',
                },
              );
            }
          },
        },
        retryBackoffMilliseconds: {
          type: PrimitiveValuetypes.Integer,
          defaultValue: 2000,
          docs: {
            description:
              'Configures the wait time in milliseconds before executing a retry.',
            examples: [
              {
                code: 'retryBackoff: 5000',
                description: 'Waits 5s (5000 ms) before executing a retry.',
              },
            ],
          },
          validation: (property, validationContext, evaluationContext) => {
            const minBockoffValue = 1000;

            const encodingValue = evaluatePropertyValue(
              property,
              evaluationContext,
              PrimitiveValuetypes.Integer,
            );
            if (encodingValue === undefined) {
              return;
            }

            if (encodingValue < minBockoffValue) {
              validationContext.accept(
                'error',
                `Only integers larger or equal to ${minBockoffValue} are allowed`,
                {
                  node: property,
                  property: 'value',
                },
              );
            }
          },
        },
        retryBackoffStrategy: {
          type: PrimitiveValuetypes.Text,
          defaultValue: 'exponential',
          docs: {
            description:
              'Configures the wait strategy before executing a retry. Can have values "exponential" or "linear".',
            examples: [
              {
                code: 'retryBackoffStrategy: "linear"',
                description:
                  'Waits always the same amount of time before executing a retry.',
              },
              {
                code: 'retryBackoffStrategy: "exponential"',
                description:
                  'Exponentially increases the wait time before executing a retry.',
              },
            ],
          },
          validation: (property, validationContext, evaluationContext) => {
            const allowedValues = ['exponential', 'linear'];

            const encodingValue = evaluatePropertyValue(
              property,
              evaluationContext,
              PrimitiveValuetypes.Text,
            );
            if (encodingValue === undefined) {
              return;
            }

            if (!allowedValues.includes(encodingValue)) {
              validationContext.accept(
                'error',
                `Only the following values are allowed: ${allowedValues
                  .map((v) => `"${v}"`)
                  .join(', ')}`,
                {
                  node: property,
                  property: 'value',
                },
              );
            }
          },
        },
      },

      // Input type:
      IOType.NONE,

      // Output type:
      IOType.FILE,
    );
    this.docs.description = 'Extracts a `File` from the web.';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description: 'Fetches a file from the given URL.',
      },
    ];
  }
}

const blockExampleUsage = `block CarsFileExtractor oftype HttpExtractor {
  url: "tinyurl.com/4ub9spwz";
}`;
