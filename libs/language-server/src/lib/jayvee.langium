grammar Jayvee

entry Model:
  (blocks+=Block | layouts+=Layout | pipes+=Pipe)*;

Block:
  'block' name=ID 'oftype' type=BlockType;

BlockType:
  CSVFileExtractor | LayoutValidator | PostgresLoader;

CSVFileExtractor:
  'CSVFileExtractor' '{'
    url=UrlAttribute
  '}';

UrlAttribute returns StringAttribute:
  'url' ':' value=StringAttributeValue ';';

LayoutValidator:
  'LayoutValidator' '{'
    'layout' ':' layout=[Layout] ';'
  '}';

PostgresLoader:
  name='PostgresLoader' '{'
    host=HostAttribute &
    port=PortAttribute &
    username=UsernameAttribute &
    password=PasswordAttribute &
    database=DatabaseAttribute &
    table=TableAttribute
  '}';

HostAttribute returns StringAttribute:
  'host' ':' value=StringAttributeValue ';';

PortAttribute returns IntAttribute:
  'port' ':' value=IntAttributeValue ';';

UsernameAttribute returns StringAttribute:
  'username' ':' value=StringAttributeValue ';';

PasswordAttribute returns StringAttribute:
  'password' ':' value=StringAttributeValue ';';

DatabaseAttribute returns StringAttribute:
  'database' ':' value=StringAttributeValue ';';

TableAttribute returns StringAttribute:
  'table' ':' value=StringAttributeValue ';';

interface StringAttribute {
  value: StringAttributeValue
}

interface IntAttribute {
  value: IntAttributeValue
}

StringAttributeValue:
  StringValue | RuntimeParameter;

StringValue:
  value=STRING;

IntAttributeValue:
  IntValue | RuntimeParameter;

IntValue:
  value=INT;

RuntimeParameter:
  'requires' name=ID;

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
