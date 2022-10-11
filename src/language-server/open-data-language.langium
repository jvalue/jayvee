grammar OpenDataLanguage

entry Model:
  (libraries+=Library | pipelines+=Pipeline)*;

Library:
  'library' name=ID '{'
    (elements+=LibraryElement)*
  '}';

LibraryElement:
  Export | Import | Valuetype | Block;

Export:
  'export' element=[ExportableElement:QualifiedName] ('as' rename=ID)? ';';

Import:
  'import' valuetype=[ExportableElement:QualifiedName] ('as' rename=ID)? ';';

ExportableElement:
  Valuetype | Block;

Pipeline:
  'pipeline' name=ID '{'
    (elements+=PipelineElement)*
  '}';

PipelineElement:
  Import | Valuetype | Block | Pipe;

Valuetype:
  'valuetype' name=ID
  'extends' (
    hasSuperTypeString?='String' |
    hasSuperTypeInteger?='Integer' |
    superType=[Valuetype:QualifiedName]
  ) '{'
    (attributes+=Attribute)*
  '}';

Block:
  Source | Sink | Step;

Source:
  'source' name=ID 'typeof' sourceType=(
    'Http'
  ) '{'
    ('inputs' ':' '[' ']' ';')?
    (outputsAttribute=OutputsAttribute)?
    (attributes+=Attribute)*
  '}';

Sink:
  'sink' name=ID 'typeof' sourceType=(
    'RelationalDatabase' |
    'File'
  ) '{'
    (inputsAttribute=InputsAttribute)?
    ('outputs' ':' '[' ']' ';')?
    (attributes+=Attribute)*
  '}';

Step:
  'step' name=ID 'typeof' stepType=(
    'CSVTable' |
    'TableSelection' |
    'SchemaGuard'
  ) '{'
    (inputsAttribute=InputsAttribute)?
    (outputsAttribute=OutputsAttribute)?
    (attributes+=Attribute)*
  '}';

InputsAttribute:
  'inputs' ':' '[' (inputs+=Input)? (',' inputs+=Input)* ']' ';';

Input:
  name=ID 'as' rename=ID;

OutputsAttribute:
  'outputs' ':' '[' (outputs+=Output)? (',' outputs+=Output)* ']' ';';

Output:
  name=ID 'as' rename=ID;

Pipe:
  'pipe' '{'
    ('from' ':' fromOutput=QualifiedName) &
    ('to' ':' toInput=QualifiedName)
  '}';

Attribute:
  name=ID ':' (
    AttributeValue | 
    ('requires' runtimeParameter=ID
      ('default' defaultValue=AttributeValue)?
    )
  ) ';';

AttributeValue:
  value=(STRING | INT | TRUE | FALSE);

QualifiedName returns string:
  ID ('.' ID)*;

hidden terminal WS: /\s+/;
terminal TRUE returns boolean: /true/;
terminal FALSE returns boolean: /false/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
