// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  BinaryFile,
  BlockExecutor,
  BlockExecutorClass,
  ExecutionContext,
  Sheet,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import * as E from 'fp-ts/lib/Either';
import { Either } from 'fp-ts/lib/Either';
import * as GtfsRealtimeBindings from 'gtfs-realtime-bindings';

@implementsStatic<BlockExecutorClass>()
export class GtfsRTInterpreterExecutor
  implements BlockExecutor<IOType.FILE, IOType.SHEET>
{
  public static readonly type = 'GtfsRTInterpreter';
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
    if (E.isLeft(sheet)) {
      return Promise.resolve(
        R.err({
          message: sheet.left.message,
          diagnostic: { node: context.getCurrentNode(), property: 'name' },
        }),
      );
    }
    return R.ok(sheet.right);
  }

  private async parseFeedMessage(
    entity_type: string,
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<Either<Error, Sheet>> {
    return new Promise((resolve) => {
      switch (entity_type) {
        case 'trip_update':
          // Extract the trip updates from thee feed message
          resolve(this.parseTripUpdates(feedMessage, context));
          break;
        case 'alert':
          // TODO: parse alert;
          break;
        case 'vehicle':
          // TODO: parse vehicle;
          break;

        // No entitiy detected -> error
        default:
          resolve(E.left(new Error('No entity detected in GTFS-RT-Feed. ')));
          break;
      }
    });
  }

  private parseTripUpdates(
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<Either<Error, Sheet>> {
    return new Promise((resolve) => {
      context.logger.logDebug(`Parsing raw gtfs-rt feed data as TripUpdates"`);
      const rows: string[][] = [];

      // Add header
      rows.push(Object.keys(new TripUpdate()));

      for (const entity of feedMessage.entity) {
        if (entity.tripUpdate) {
          if (entity.tripUpdate.stopTimeUpdate) {
            for (const stopTimeUpdate of entity.tripUpdate.stopTimeUpdate) {
              const tripUpdate: TripUpdate = {
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
                  stopTimeUpdate.stopSequence,
                ),
                'entity.trip_update.stop_time_update.stop_id': String(
                  stopTimeUpdate.stopId,
                ),
                'entity.trip_update.stop_time_update.arrival.time': String(
                  stopTimeUpdate.arrival?.time,
                ),
                'entity.trip_update.stop_time_update.departure.time': String(
                  stopTimeUpdate.departure?.time,
                ),
              };
              rows.push(Object.values(tripUpdate) as string[]);
            }
          } else {
            context.logger.logDebug(
              `Parsing gtfs-rt feed data as TripUpdates: StopTimeUpdate of TripUpdate "${String(
                entity.tripUpdate.trip.tripId,
              )}" does not contain a single entry. Skipping this TripUpdate and continue with next one"`,
            );
            continue;
          }
        } else {
          // TODO: Should we continue here or break?
          context.logger.logDebug(
            `Parsing gtfs-rt feed data as TripUpdates: No Tripupdates found in feedmessage with timestamp "${String(
              feedMessage.header.timestamp,
            )}"`,
          );
        }
      }
      resolve(E.right(new Sheet(rows)));
    });
  }
}

// This class has to match with schema defined in downstream TableInterpreter
class TripUpdate {
  'header.gtfs_realtime_version' = '';
  'header.timestamp' = '';
  'header.incrementality' = '';
  'entity.id' = '';
  'entity.trip_update.trip.trip_id' = '';
  'entity.trip_update.trip.route_id' = '';
  'entity.trip_update.stop_time_update.stop_sequence' = '';
  'entity.trip_update.stop_time_update.stop_id' = '';
  'entity.trip_update.stop_time_update.arrival.time' = '';
  'entity.trip_update.stop_time_update.departure.time' = '';
}
