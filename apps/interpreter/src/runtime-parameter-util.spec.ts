import {
  AttributeValueType,
  RuntimeParameter,
  runtimeParameterAllowedForType,
} from '@jvalue/language-server';

import { parseParameterAsMatchingType } from './runtime-parameter-util';

describe('runtime parameter utils', () => {
  describe('parameter parsing', () => {
    Object.keys(AttributeValueType).forEach((attributeValueTypeKey) => {
      const attributeValueType =
        AttributeValueType[
          attributeValueTypeKey as keyof typeof AttributeValueType
        ];

      const parseParameterFn = () => {
        parseParameterAsMatchingType(
          '',
          attributeValueType,
          // Don't care about the diagnostics:
          {} as RuntimeParameter,
        );
      };

      if (runtimeParameterAllowedForType(attributeValueType)) {
        it(`should not throw error on allowed type ${attributeValueType}`, () => {
          expect(parseParameterFn).not.toThrowError();
        });
      } else {
        it(`should throw error on forbidden type ${attributeValueType}`, () => {
          expect(parseParameterFn).toThrowError();
        });
      }
    });
  });
});
