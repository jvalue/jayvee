import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import { Sheet } from '@jayvee/language-server';

export class MyExtractorExecutor extends BlockExecutor<void, Sheet> {
  constructor() {
    // Needs to match the name in meta information:
    super('MyExtractor');
  }

  override async execute(): Promise<R.Result<Sheet>> {
    // Accessing attribute values by their name:
    const url = this.getStringAttributeValue('url');
    const limit = this.getIntAttributeValue('limit');
    
    // ...

    if (error) {
      return R.err(...);
    }

    return R.ok(...);
  }
}