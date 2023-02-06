import {
  AttributeType,
  RuntimeParameter,
  runtimeParameterAllowedForType,
} from '@jayvee/language-server';

import { parseParameterAsMatchingType } from './runtime-parameter-util';

describe('runtime parameter utils', () => {
  describe('parameter parsing', () => {
    Object.keys(AttributeType).forEach((attributeTypeKey) => {
      const attributeType =
        AttributeType[attributeTypeKey as keyof typeof AttributeType];

      const parseParameterFn = () => {
        parseParameterAsMatchingType(
          '',
          attributeType,
          // Don't care about the diagnostics:
          {} as RuntimeParameter,
        );
      };

      if (runtimeParameterAllowedForType(attributeType)) {
        it(`should not throw error on allowed type ${attributeType}`, () => {
          expect(parseParameterFn).not.toThrowError();
        });
      } else {
        it(`should throw error on forbidden type ${attributeType}`, () => {
          expect(parseParameterFn).toThrowError();
        });
      }
    });
  });
});
