import { BlocktypeInput, BlocktypeOutput } from './generated/ast';

export enum IOType {
  NONE = 'None',
  FILE = 'File',
  TEXT_FILE = 'TextFile',
  FILE_SYSTEM = 'FileSystem',
  SHEET = 'Sheet',
  TABLE = 'Table',
}

export function getIOType(blockIO: BlocktypeInput | BlocktypeOutput): IOType {
  return IOType[blockIO.iotype.ref?.name as keyof typeof IOType] ?? IOType.NONE;
}
