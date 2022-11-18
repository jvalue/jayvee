grammar Jayvee

import 'terminals'
import 'attributes'
import 'layout'

import './blocks/block-types';

entry Model:
  (blocks+=Block | layouts+=Layout | pipes+=Pipe)*;

Block:
  'block' name=ID 'oftype' type=BlockType;

Pipe:
  'pipe' '{'
    'from' ':' from=[Block] ';'
    'to' ':' to=[Block] ';'
  '}';
