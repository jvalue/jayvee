// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/execution';
import {
  BinaryFile,
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  Sheet,
  implementsStatic,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import * as GtfsRealtimeBindings from 'gtfs-realtime-bindings';

@implementsStatic<BlockExecutorClass>()
export class GtfsRTInterpreterExecutor
  implements BlockExecutor<IOType.FILE, IOType.SHEET>
{
  public static readonly type = ' GtfsRTInterpreter';
  public readonly inputType = IOType.FILE;
  public readonly outputType = IOType.SHEET;

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(
    inputFile: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    // Accessing attribute values by their name:
    const entity = context.getTextPropertyValue('entity');

    //https://github.com/MobilityData/gtfs-realtime-bindings/tree/master/nodejs
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(inputFile.content),
    );
    // TODO: Parse all possible feedentity to table

    // let val = 1;
    // // TODO: Error
    // // eslint-disable-next-line no-constant-condition
    // if (val === 1) {
    //   return R.err({
    //     message: 'The specified cell range does not fit the sheet',
    //     diagnostic: { node: this.block, property: 'name' },
    //   });
    // }
    // val++;

    return R.ok(null as unknown as Sheet);
  }
}
