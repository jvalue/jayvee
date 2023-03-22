import {
  PropertyValuetype,
  RuntimeParameterLiteral,
  runtimeParameterAllowedForType,
} from '@jvalue/language-server';

import { parseParameterAsMatchingType } from './runtime-parameter-util';

describe('runtime parameter utils', () => {
  describe('parameter parsing', () => {
    Object.keys(PropertyValuetype).forEach((propertyValuetypeKey) => {
      const propertyValuetype =
        PropertyValuetype[
          propertyValuetypeKey as keyof typeof PropertyValuetype
        ];

      const parseParameterFn = () => {
        parseParameterAsMatchingType(
          '',
          propertyValuetype,
          // Don't care about the diagnostics:
          {} as RuntimeParameterLiteral,
        );
      };

      if (runtimeParameterAllowedForType(propertyValuetype)) {
        it(`should not throw error on allowed type ${propertyValuetype}`, () => {
          expect(parseParameterFn).not.toThrowError();
        });
      } else {
        it(`should throw error on forbidden type ${propertyValuetype}`, () => {
          expect(parseParameterFn).toThrowError();
        });
      }
    });
  });
});
