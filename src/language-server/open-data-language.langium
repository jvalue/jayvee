grammar OpenDataLanguage

entry Model:
  (blocks+=Block | layouts+=Layout | pipes+=Pipe)*;

Block:
  'block' name=ID 'oftype' type=BlockType;

BlockType:
  CSVFileExtractor | LayoutValidator | PostgresLoader;

CSVFileExtractor:
  'CSVFileExtractor' '{'
    'url' ':' url=STRING ';'
  '}';

LayoutValidator:
  'LayoutValidator' '{'
    'layout' ':' layout=[Layout] ';'
  '}';

PostgresLoader:
  name='PostgresLoader' '{' '}';

Layout:
  'layout' name=ID '{'
    (sections+=Section)*
  '}';

Section:
  ColumnSection | RowSection;

ColumnSection:
  // Uses ID as terminal for columnId because an additional terminal would conflict with ID
  'column' columnId=ID ':' type=Type ';';

RowSection:
  (header?='header')? 'row' rowId=INT ':' type=Type ';';

Type returns string:
  'text' | 'decimal' | 'integer' | 'boolean';

Pipe:
  'pipe' '{'
    'from' ':' from=[Block] ';'
    'to' ':' to=[Block] ';'
  '}';

hidden terminal WS: /\s+/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
