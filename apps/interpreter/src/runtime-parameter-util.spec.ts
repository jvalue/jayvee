// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  PrimitiveValuetypes,
  RuntimeParameterLiteral,
} from '@jvalue/jayvee-language-server';

import { parseParameterAsMatchingType } from './runtime-parameter-util';

describe('runtime parameter utils', () => {
  describe('parameter parsing', () => {
    Object.keys(PrimitiveValuetypes).forEach((primitiveValueTypeKey) => {
      const primitiveValuetype =
        PrimitiveValuetypes[
          primitiveValueTypeKey as keyof typeof PrimitiveValuetypes
        ];

      const parseParameterFn = () => {
        parseParameterAsMatchingType(
          '',
          primitiveValuetype,
          // Don't care about the diagnostics:
          {} as RuntimeParameterLiteral,
        );
      };

      if (primitiveValuetype.isAllowedAsRuntimeParameter()) {
        it(`should not throw error on allowed type ${primitiveValuetype.getName()}`, () => {
          expect(parseParameterFn).not.toThrowError();
        });
      } else {
        it(`should throw error on forbidden type ${primitiveValuetype.getName()}`, () => {
          expect(parseParameterFn).toThrowError();
        });
      }
    });
  });
});
