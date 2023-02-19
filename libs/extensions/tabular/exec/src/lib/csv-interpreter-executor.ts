import * as R from '@jayvee/execution';
import { BlockExecutor } from '@jayvee/execution';
import { File, Sheet } from '@jayvee/language-server';

export class CSVInterpreterExecutor extends BlockExecutor<File, Sheet> {
  constructor() {
    // Needs to match the name in meta information:
    super('MyExtractor');
  }

  override async execute(): Promise<R.Result<Sheet>> {


    if (error) {
      return R.err(...);
    }

    return R.ok(...);
  }
}