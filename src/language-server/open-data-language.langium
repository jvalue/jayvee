grammar OpenDataLanguage

entry Model:
  (blocks+=Block | schemas+=Schema | pipes+=Pipe)*;

Block:
  'block' name=ID 'typeof' type=(CSVFileExtractor | SchemaValidator | PostgresLoader);

CSVFileExtractor:
  'CSVFileExtractor' '{'
    'url' ':' url=STRING ';'
  '}';

SchemaValidator:
  'SchemaValidator' '{'
    'schema' ':' schema=[Schema] ';'
  '}';

PostgresLoader:
  'PostgresLoader' '{'
    'uri' ':' uri=STRING ';'
  '}';

Schema:
  'schema' name=ID '{'
    (selections+=Selection)*
  '}';

Selection:
  ColumnSelection | RowSelection;

ColumnSelection:
  // Uses ID as terminal for columnId because an additional terminal would conflict with ID
  'column' columnId=ID ':' type=Type ';';

RowSelection:
  (header?='header')? 'row' rowId=INT ':' type=Type ';';

Type returns string:
  'text' | 'decimal' | 'integer';

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
