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
  SinglePipe | ChainedPipe;

SinglePipe:
  'pipe' '{'
    'from' ':' from=[Block] ';'
    'to' ':' to=[Block] ';'
  '}';

ChainedPipe:
    blocks+=[Block] ('->' blocks+=[Block])+ ';';
