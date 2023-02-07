hidden terminal WS: /\s+/;

terminal CELL_ID: /([A-Z]+|\*)([0-9]+|\*)/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
