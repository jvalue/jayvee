import * as R from '@jvalue/execution';
import { BlockExecutor, File, Sheet } from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';

export class GtfsRTInterpreterExecutor extends BlockExecutor<IOType.FILE, IOType.SHEET> {
  constructor() {
    // Needs to match the name in meta information:
    super('GtfsRTInterpreter', IOType.FILE, IOType.SHEET);
  }

  override async execute(inputSheet: File): Promise<R.Result<Sheet>> {
   
    // Accessing attribute values by their name:
    const entity = this.getStringAttributeValue('entity');
    
    // ...

    // TODO: Error
    if (true) {
      return R.err({
        message: 'The specified cell range does not fit the sheet',
        diagnostic: { node: this.block, property: 'name'},
      });
    }

    return R.ok(...);
  }
}