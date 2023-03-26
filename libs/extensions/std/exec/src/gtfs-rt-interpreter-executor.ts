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

  async execute(
    inputFile: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    // Accessing attribute values by their name:
    const entity = context.getTextPropertyValue('entity');

    // https://github.com/MobilityData/gtfs-realtime-bindings/tree/master/nodejs
    const feedMessage =
      GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(inputFile.content),
      );

    // TODO: Parse all possible feedentity to table
    const parsedFeedMessage = await this.parseFeedMessage(
      entity,
      feedMessage,
      context,
    );
    if (R.isErr(parsedFeedMessage)) {
      return parsedFeedMessage;
    }

    return R.ok(parsedFeedMessage.right);
  }

  private parseFeedMessage(
    entity: string,
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    return new Promise((resolve) => {
      switch (entity) {
        case 'trip_update':
          // TODO;
          break;
        case 'alert':
          // TODO;
          break;
        case 'vehicle':
          // TODO;
          break;

        // No entitiy detected -> error
        default:
          resolve(
            R.err({
              message: `For parsing GTFS-RT data provide an entity to parse such as "trip_update", "alert" or "vehicle"`,
              diagnostic: { node: context.getCurrentNode(), property: 'name' },
            }),
          );
          break;
      }
    });
  }
}
