// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// The order of the terminals matters here, it implicitly defines the prioritization for the lexer.
// For more details, see https://langium.org/docs/grammar-language/#terminal-rules

terminal CELL_REFERENCE: /[A-Z]+/ INTEGER;
terminal ID: /[_a-zA-Z][\w_]*/;

terminal DECIMAL returns number: INTEGER '.' INTEGER;
terminal INTEGER returns number: /[0-9]+/;

terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;

terminal REGEX: /\/.+\//;

hidden terminal WHITESPACE: /\s+/;
