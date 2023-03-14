grammar Jayvee

import 'terminals'
import 'attributes'
import 'value-type'
import 'constraints'

entry Model:
  (pipelines+=Pipeline | valuetypes+=Valuetype | constraints+=Constraint)*;

Pipeline:
  'pipeline' name=ID '{'
    (blocks+=Block | pipes+=Pipe | valuetypes+=Valuetype | constraints+=Constraint)*
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
