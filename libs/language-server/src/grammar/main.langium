grammar Jayvee

import 'terminals'
import 'attributes'

entry Model:
  (pipelines+=Pipeline)*;

Pipeline:
  'pipeline' name=ID '{'
    (blocks+=Block | pipes+=Pipe)*
  '}';

Block:
  'block' name=ID 'oftype' type=ID AttributesFragment;

Pipe:
  'pipe' '{'
    'from' ':' from=[Block] ';'
    'to' ':' to=[Block] ';'
  '}';
