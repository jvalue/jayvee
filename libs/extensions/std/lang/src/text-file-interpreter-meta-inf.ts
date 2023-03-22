import { BlockMetaInformation, IOType } from '@jvalue/language-server';

export class TextFileInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextFileInterpreter',
      {},
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.TEXT_FILE,
    );
    this.docs.description = 'Interprets a `File` as a `TextFile`.';
  }
}
