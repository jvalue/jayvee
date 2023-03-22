// The order of the terminals matters here, it implicitly defines the prioritization for the lexer.
// For more details, see https://langium.org/docs/grammar-language/#terminal-rules

terminal TRUE returns boolean: /true/;
terminal FALSE returns boolean: /false/;
terminal CELL_REFERENCE: /([A-Z]+|\*)([0-9]+|\*)/;
terminal ID: /[_a-zA-Z][\w_]*/;

// INTEGER is required for row IDs and overlaps with NUMBER below
terminal INTEGER returns number: /[0-9]+/;
terminal NUMBER returns number: /[+-]?[0-9]+(\.[0-9]+)?/;

terminal STRING: /"[^"]*"|'[^']*'/;

terminal REGEX: /\/.+\//;

hidden terminal WHITESPACE: /\s+/;
hidden terminal SINGLE_LINE_COMMENT: /\/\/[^\n\r]*/;
