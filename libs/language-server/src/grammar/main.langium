grammar Jayvee

import 'terminals'
import 'attributes'
import 'layout'

entry Model:
  (pipelines+=Pipeline | layouts+=Layout)*;

Pipeline:
  'pipeline' name=ID '{'
    (blocks+=Block | layouts+=Layout | pipes+=Pipe)*
  '}';

Block:
  'block' name=ID 'oftype' type=ID AttributesFragment;

Pipe:
  'pipe' '{'
    'from' ':' from=[Block] ';'
    'to' ':' to=[Block] ';'
  '}';
