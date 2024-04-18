// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BinaryFile,
  type BlockExecutorClass,
  type ExecutionContext,
  Sheet,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import { IOType } from '@jvalue/jayvee-language-server';
import * as E from 'fp-ts/lib/Either';
import { type Either } from 'fp-ts/lib/Either';
import * as GtfsRealtimeBindings from 'gtfs-realtime-bindings';

@implementsStatic<BlockExecutorClass>()
export class GtfsRTInterpreterExecutor extends AbstractBlockExecutor<
  IOType.FILE,
  IOType.SHEET
> {
  public static readonly type = 'GtfsRTInterpreter';

  constructor() {
    super(IOType.FILE, IOType.SHEET);
  }

  async doExecute(
    inputFile: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<Sheet>> {
    // Accessing attribute values by their name:
    const entity = context.getPropertyValue(
      'entity',
      context.valueTypeProvider.Primitives.Text,
    );

    // https://github.com/MobilityData/gtfs-realtime-bindings/tree/master/nodejs
    let feedMessage;
    try {
      feedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(inputFile.content),
      );
    } catch (e) {
      return Promise.resolve(
        R.err({
          message: `Failed to decode gtfs file: ${this.getErrorMessage(e)}`,
          diagnostic: { node: context.getCurrentNode() },
        }),
      );
    }

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

  private getErrorMessage(e: unknown): string {
    if (e instanceof Error) {
      return e.message;
    }
    return String(e);
  }

  private async parseFeedMessage(
    entityType: string,
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<Either<Error, Sheet>> {
    switch (entityType) {
      case 'trip_update':
        // Extract the trip updates from thee feed message
        return this.parseTripUpdates(feedMessage, context);
      case 'alert':
        // Extract the alerts from thee feed message
        return this.parseAlerts(feedMessage, context);
      case 'vehicle':
        // Extract vehicle positions from thee feed message
        return this.parseVehiclePositions(feedMessage, context);
      // Entity invalid
      default:
        return E.left(
          new Error(
            `Entity ${entityType} not allowed for block GtfsRTInterpreterblock, expected "trip_update", "alert" or "vehicle".`,
          ),
        );
    }
  }

  private parseTripUpdates(
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<Either<Error, Sheet>> {
    return new Promise((resolve) => {
      context.logger.logDebug(`Parsing raw gtfs-rt feed data as TripUpdate"`);
      const rows: string[][] = [];

      // Add Header
      rows.push([...tripUpdateHeader]);

      for (const entity of feedMessage.entity) {
        // Case: No TripUpdates found -> return sheet just with header
        if (!entity.tripUpdate) {
          context.logger.logDebug(
            `Parsing gtfs-rt feed data as TripUpdates: No Tripupdates found in feedmessage with timestamp "${String(
              feedMessage.header.timestamp,
            )}"`,
          );
          break;
        }

        // Case: No stopTimeUpdate found -> continue with next TripUpdate
        if (!entity.tripUpdate.stopTimeUpdate) {
          context.logger.logDebug(
            `Parsing gtfs-rt feed data as TripUpdates: StopTimeUpdate of TripUpdate "${String(
              entity.tripUpdate.trip.tripId,
            )}" does not contain a single entry. Skipping this TripUpdate and continue with next one"`,
          );
          continue;
        }

        for (const stopTimeUpdate of entity.tripUpdate.stopTimeUpdate) {
          const row: Record<TripUpdate, string> = {
            'header.gtfs_realtime_version':
              feedMessage.header.gtfsRealtimeVersion,
            'header.timestamp': feedMessage.header.timestamp?.toString() ?? '',
            'header.incrementality':
              feedMessage.header.incrementality?.toString() ?? '',
            'entity.id': entity.id,
            'entity.trip_update.trip.trip_id':
              entity.tripUpdate.trip.tripId?.toString() ?? '',
            'entity.trip_update.trip.route_id':
              entity.tripUpdate.trip.routeId?.toString() ?? '',
            'entity.trip_update.stop_time_update.stop_sequence':
              stopTimeUpdate.stopSequence?.toString() ?? '',
            'entity.trip_update.stop_time_update.stop_id':
              stopTimeUpdate.stopId?.toString() ?? '',
            'entity.trip_update.stop_time_update.arrival.time':
              stopTimeUpdate.arrival?.time?.toString() ?? '',
            'entity.trip_update.stop_time_update.departure.time':
              stopTimeUpdate.departure?.time?.toString() ?? '',
          };
          rows.push(Object.values(row));
        }
      }
      resolve(E.right(new Sheet(rows)));
    });
  }

  private parseVehiclePositions(
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<Either<Error, Sheet>> {
    return new Promise((resolve) => {
      context.logger.logDebug(
        `Parsing raw gtfs-rt feed data as VehiclePosition"`,
      );

      const rows: string[][] = [];

      // Add header
      rows.push([...vehiclePositionHeader]);

      for (const entity of feedMessage.entity) {
        // Case: No VehiclePositions found -> return sheet just with header
        if (!entity.vehicle) {
          context.logger.logDebug(
            `Parsing gtfs-rt feed data as VehiclePosition: No VehiclePositions found in feedmessage with timestamp "${String(
              feedMessage.header.timestamp,
            )}"`,
          );
          break;
        }
        const row: Record<VehiclePosition, string> = {
          'header.gtfs_realtime_version':
            feedMessage.header.gtfsRealtimeVersion,
          'header.timestamp': feedMessage.header.timestamp?.toString() ?? '',
          'header.incrementality':
            feedMessage.header.incrementality?.toString() ?? '',
          'entity.id': String(entity.id),
          'entity.vehicle_position.vehicle_descriptor.id':
            entity.vehicle.vehicle?.id?.toString() ?? '',
          'entity.vehicle_position.trip.trip_id':
            entity.vehicle.trip?.tripId?.toString() ?? '',
          'entity.vehicle_position.trip.route_id':
            entity.vehicle.trip?.routeId?.toString() ?? '',
          'entity.vehicle_position.position.latitude':
            entity.vehicle.position?.latitude.toString() ?? '',
          'entity.vehicle_position.position.longitude':
            entity.vehicle.position?.longitude.toString() ?? '',
          'entity.vehicle_position.timestamp':
            entity.vehicle.timestamp?.toString() ?? '',
        };
        rows.push(Object.values(row));
      }
      resolve(E.right(new Sheet(rows)));
    });
  }

  private parseAlerts(
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<Either<Error, Sheet>> {
    return new Promise((resolve) => {
      context.logger.logDebug(`Parsing raw gtfs-rt feed data as Alerts"`);
      const rows: string[][] = [];

      // Add header
      rows.push([...alertHeader]);

      for (const entity of feedMessage.entity) {
        // Case: No Alerts found -> return sheet just with header
        if (!entity.alert) {
          context.logger.logDebug(
            `Parsing gtfs-rt feed data as Alert: No Alerts found in feedmessage with timestamp "${String(
              feedMessage.header.timestamp,
            )}"`,
          );
          break;
        }
        if (!entity.alert.informedEntity) {
          context.logger.logDebug(
            `Parsing gtfs-rt feed data as Alert: InformedEntity of Alert does not contain a single entry. Skipping this Alert and continue with next one"`,
          );
          continue;
        }
        for (const informedEntity of entity.alert.informedEntity) {
          const row: Record<Alert, string> = {
            'header.gtfs_realtime_version':
              feedMessage.header.gtfsRealtimeVersion,
            'header.timestamp': feedMessage.header.timestamp?.toString() ?? '',
            'header.incrementality':
              feedMessage.header.incrementality?.toString() ?? '',
            'entity.id': entity.id.toString(),
            'entity.alert.informed_entity.route_id':
              informedEntity.routeId?.toString() ?? '',
            'entity.alert.header_text':
              entity.alert.headerText?.translation?.shift()?.text.toString() ??
              '',
            'entity.alert.description_text':
              entity.alert.descriptionText?.translation
                ?.shift()
                ?.text.toString() ?? '',
          };
          rows.push(Object.values(row));
        }
      }
      resolve(E.right(new Sheet(rows)));
    });
  }
}

const tripUpdateHeader = [
  'header.gtfs_realtime_version',
  'header.timestamp',
  'header.incrementality',
  'entity.id',
  'entity.trip_update.trip.trip_id',
  'entity.trip_update.trip.route_id',
  'entity.trip_update.stop_time_update.stop_sequence',
  'entity.trip_update.stop_time_update.stop_id',
  'entity.trip_update.stop_time_update.arrival.time',
  'entity.trip_update.stop_time_update.departure.time',
] as const;
type TripUpdate = (typeof tripUpdateHeader)[number];

const vehiclePositionHeader = [
  'header.gtfs_realtime_version',
  'header.timestamp',
  'header.incrementality',
  'entity.id',
  'entity.vehicle_position.vehicle_descriptor.id',
  'entity.vehicle_position.trip.trip_id',
  'entity.vehicle_position.trip.route_id',
  'entity.vehicle_position.position.latitude',
  'entity.vehicle_position.position.longitude',
  'entity.vehicle_position.timestamp',
] as const;
type VehiclePosition = (typeof vehiclePositionHeader)[number];

const alertHeader = [
  'header.gtfs_realtime_version',
  'header.timestamp',
  'header.incrementality',
  'entity.id',
  'entity.alert.informed_entity.route_id',
  'entity.alert.header_text',
  'entity.alert.description_text',
] as const;
type Alert = (typeof alertHeader)[number];
