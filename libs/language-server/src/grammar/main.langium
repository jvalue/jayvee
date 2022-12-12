grammar Jayvee

import 'terminals'
import 'attributes'
import 'layout'
import 'block-types'

entry Model:
  (pipelines+=Pipeline | layouts+=Layout)*;

Pipeline:
  'pipeline' name=ID '{'
    (blocks+=Block | layouts+=Layout | pipes+=Pipe)*
  '}';

Block:
  'block' name=ID 'oftype' type=BlockType AttributesFragment;

Pipe:
  'pipe' '{'
    'from' ':' from=[Block] ';'
    'to' ':' to=[Block] ';'
  '}';
