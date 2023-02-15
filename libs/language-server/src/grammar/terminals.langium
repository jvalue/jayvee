hidden terminal WS: /\s+/;

// The CELL_ID terminal needs to be above the ID terminal, so the lexer returns the correct match.
// See https://langium.org/docs/grammar-language/#terminal-rules for details.
terminal CELL_ID: /([A-Z]+|\*)([0-9]+|\*)/;
terminal TRUE returns boolean: /true/;
terminal FALSE returns boolean: /false/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
