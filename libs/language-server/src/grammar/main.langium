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
  'block' name=ID 'oftype' type=BlockType AttributesFragment;

BlockType:
  name=ID;

Pipe:
  'pipe' '{'
    'from' ':' from=[Block] ';'
    'to' ':' to=[Block] ';'
  '}';
