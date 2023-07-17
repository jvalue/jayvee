// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

export const STANDARD_LIBRARY_FILENAME = 'standard.jv';

export const STANDARD_LIBRARY_SOURCECODE = `
valuetype Percent oftype decimal {
    constraints: [ZeroToHundredDecimal];
}
constraint ZeroToHundredDecimal on decimal: value >= 0 and value <= 100;
`.trimStart();
