import { IOType } from '@jayvee/language-server';

import { IOTypeImplementation } from './io-type-implementation';

export class Undefined implements IOTypeImplementation<IOType.UNDEFINED> {
  public readonly ioType = IOType.UNDEFINED;
  private static _instance?: Undefined;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static get singletonInstance(): Undefined {
    if (this._instance === undefined) {
      this._instance = new this();
    }
    return this._instance;
  }
}

export const UNDEFINED = Undefined.singletonInstance;
