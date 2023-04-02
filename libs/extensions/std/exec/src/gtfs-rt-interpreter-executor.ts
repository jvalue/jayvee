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
import * as E from 'fp-ts/lib/Either';
import { Either, isLeft } from 'fp-ts/lib/Either';
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

    // Parse all possible feedentity to Sheet
    const sheet = await this.parseFeedMessage(entity, feedMessage, context);
    if (R.isErr(sheet)) {
      return sheet;
    }

    return R.ok(sheet.right);
  }

  private parseFeedMessage(
    entity_type: string,
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    return new Promise((resolve) => {
      let data: Promise<E.Either<Error, string[][]>>;
      switch (entity_type) {
        case 'trip_update':
          // Extract the trip updates from thee feed message
          data = this.parseTripUpdates(feedMessage);
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
      resolve(R.ok(new Sheet()));
    });
  }

  private parseTripUpdates(
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
  ): Promise<Either<Error, string[][]>> {
    return new Promise((resolve) => {
      const header: string[] = Object.keys({} as TripUpdates);
      const rows: string[][] = [];
      rows.push(header);
      for (const entity of feedMessage.entity) {
        if (entity.tripUpdate) {
          if (entity.tripUpdate.stopTimeUpdate) {
            for (const stop_time_update of entity.tripUpdate.stopTimeUpdate) {
              const tripUpdate: TripUpdates = {
                'header.gtfs_realtime_version':
                  feedMessage.header.gtfsRealtimeVersion,
                'header.timestamp': String(feedMessage.header.timestamp),
                'header.incrementality': String(
                  feedMessage.header.incrementality,
                ),
                'entity.id': String(entity.id),
                'entity.trip_update.trip.trip_id': String(
                  entity.tripUpdate.trip.tripId,
                ),
                'entity.trip_update.trip.route_id': String(
                  entity.tripUpdate.trip.routeId,
                ),
                'entity.trip_update.stop_time_update.stop_sequence': String(
                  stop_time_update.stopSequence,
                ),
                'entity.trip_update.stop_time_update.stop_id': String(
                  stop_time_update.stopId,
                ),
                'entity.trip_update.stop_time_update.arrival.time': String(
                  stop_time_update.arrival?.time,
                ),
                'entity.trip_update.stop_time_update.departure.time': String(
                  stop_time_update.departure?.time,
                ),
              };
              rows.push(Object.values(tripUpdate) as string[]);
            }
          } else {
            // TODO: Error case with left
          }
        } else {
          // TODO: Error case with left
        }
      }
      resolve(E.right(rows));
    });
  }
}

interface TripUpdates {
  'header.gtfs_realtime_version': string;
  'header.timestamp': string;
  'header.incrementality': string;
  'entity.id': string;
  'entity.trip_update.trip.trip_id': string;
  'entity.trip_update.trip.route_id': string;
  'entity.trip_update.stop_time_update.stop_sequence': string;
  'entity.trip_update.stop_time_update.stop_id': string;
  'entity.trip_update.stop_time_update.arrival.time': string;
  'entity.trip_update.stop_time_update.departure.time': string;
}
