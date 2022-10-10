grammar OpenDataLanguage

entry Model:
  (namespaces+=Namespace)*;

Namespace:
  'namespace' name=ID '{'
    (elements+=NamespaceElement)*
  '}';

NamespaceElement:
  Namespace | Export | Import | RuntimeParameter | Valuetype | Pipeline;

Export:
  'export' element=[ExportableElement:QualifiedName];

Import:
  'import' valuetype=[ExportableElement:QualifiedName];

ExportableElement:
  Pipeline | Valuetype;

Pipeline:
  'pipeline' name=ID '{'
    (elements+=PipelineElement)*
  '}';

PipelineElement:
  RuntimeParameter | Valuetype | 'block' Block | 'flow' Flow;
//                               ^-----^         ^----^
// workaround for otherwise ambiguous alternatives

RuntimeParameter:
  'requires' name=ID;

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
  name=ID 'extends' superBlock=(
    'SourceBlock' |
    'DatabaseSink' |
    'LogSink' |
    'TableBlock' |
    'SelectionBlock' |
    'GuardBlock'
  ) '{'
    ('inputs' ':' '[' (inputs+=Input)? (',' inputs+=Input)* ']') &
    ('outputs' ':' '[' (outputs+=Output)? (',' outputs+=Output)* ']') &
    (attributes+=Attribute)*
  '}';

Input:
  name=ID;

Output:
  name=ID;

Flow:
  name=ID '{'
    ('from' ':' from=[Output:QualifiedName]) &
    ('to' ':' to=[Input:QualifiedName])
  '}';

Attribute:
  name=ID ':' (
    runtimeParameter=[RuntimeParameter:QualifiedName] |
    value=(STRING | INT | TRUE | FALSE)
  );

QualifiedName returns string:
  ID ('.' ID)*;

hidden terminal WS: /\s+/;
terminal TRUE returns boolean: /true/;
terminal FALSE returns boolean: /false/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
