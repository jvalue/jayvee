import {
  PropertyValueType,
  RuntimeParameterLiteral,
  runtimeParameterAllowedForType,
} from '@jvalue/language-server';

import { parseParameterAsMatchingType } from './runtime-parameter-util';

describe('runtime parameter utils', () => {
  describe('parameter parsing', () => {
    Object.keys(PropertyValueType).forEach((propertyValueTypeKey) => {
      const propertyValueType =
        PropertyValueType[
          propertyValueTypeKey as keyof typeof PropertyValueType
        ];

      const parseParameterFn = () => {
        parseParameterAsMatchingType(
          '',
          propertyValueType,
          // Don't care about the diagnostics:
          {} as RuntimeParameterLiteral,
        );
      };

      if (runtimeParameterAllowedForType(propertyValueType)) {
        it(`should not throw error on allowed type ${propertyValueType}`, () => {
          expect(parseParameterFn).not.toThrowError();
        });
      } else {
        it(`should throw error on forbidden type ${propertyValueType}`, () => {
          expect(parseParameterFn).toThrowError();
        });
      }
    });
  });
});
