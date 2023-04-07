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

  // Defines Output-Sheet for entity TripUpdate --> columns in downstream TableInterpreter have to match with either one of these definitions
  private TripUpdate = class TripUpdate {
    'header.gtfs_realtime_version' = ''; // Version of speed specification. Currently "2.0"
    'header.timestamp' = ''; // The moment where this dataset was generated on the server.
    'header.incrementality' = ''; // DIFFERENTIAL is unsupported. use FULL_DATASET only
    'entity.id' = ''; // Unique identifier for the entity within the feed update message
    'entity.trip_update.trip.trip_id' = ''; // The trip_id from the GTFS feed that this selector refers to. Whether trip_id is required depends on the type of trip
    'entity.trip_update.trip.route_id' = ''; // The route_id from the GTFS feed that this selector refers to. I
    'entity.trip_update.stop_time_update.stop_sequence' = ''; // Must be the same as in stop_times.txt in the corresponding GTFS feed. Either stop_sequence or stop_id must be provided within a StopTimeUpdate - both fields cannot be empty. stop_sequence is required for trips that visit the same stop_id more than once (e.g., a loop) to disambiguate which stop the prediction is for.
    'entity.trip_update.stop_time_update.stop_id' = ''; // Must be the same as in stops.txt in the corresponding GTFS feed. Either stop_sequence or stop_id must be provided within a StopTimeUpdate - both fields cannot be empty.
    'entity.trip_update.stop_time_update.arrival.time' = ''; // If schedule_relationship is empty or SCHEDULED, either arrival or departure must be provided within a StopTimeUpdate - both fields cannot be empty. arrival and departure may both be empty when schedule_relationship is SKIPPED. If schedule_relationship is NO_DATA, arrival and departure must be empty.
    'entity.trip_update.stop_time_update.departure.time' = ''; // If schedule_relationship is empty or SCHEDULED, either arrival or departure must be provided within a StopTimeUpdate - both fields cannot be empty. arrival and departure may both be empty when schedule_relationship is SKIPPED. If schedule_relationship is NO_DATA, arrival and departure must be empty.
  };

  // Defines Output-Sheet for entity VehiclePosition --> columns in downstream TableInterpreter have to match with either one of these definitions
  private VehiclePosition =
    // Has to match with schema defined in downstream TableInterpreter
    class VehiclePosition {
      'header.gtfs_realtime_version' = ''; // Version of speed specification. Currently "2.0"
      'header.timestamp' = ''; // The moment where this dataset was generated on the server.
      'header.incrementality' = ''; // DIFFERENTIAL is unsupported. use FULL_DATASET only
      'entity.id' = ''; // Unique identifier for the entity within the feed update message
      'entity.vehicle_position.vehicle_descriptor.id' = ''; // Internal system identification of the vehicle. Should be unique per vehicle, and is used for tracking the vehicle as it proceeds through the system. This id should not be made visible to the end-user; for that purpose use the label field.
      'entity.vehicle_position.trip.trip_id' = ''; // The trip_id from the GTFS feed that this selector refers to. Whether trip_id is required depends on the type of trip
      'entity.vehicle_position.trip.route_id' = ''; // The route_id from the GTFS feed that this selector refers to.
      'entity.vehicle_position.position.latitude' = ''; // Degrees North, in the WGS-84 coordinate system.
      'entity.vehicle_position.position.longitude' = ''; // Degrees East, in the WGS-84 coordinate system.
      'entity.vehicle_position.timestamp' = ''; // Moment at which the vehicle's position was measured. In POSIX time (i.e., number of seconds since January 1st 1970 00:00:00 UTC).
    };

  // Defines Output-Sheet for entity Alert --> columns in downstream TableInterpreter have to match with either one of these definitions
  private Alert = class Alert {
    // Has to match with schema defined in downstream TableInterpreter
    'header.gtfs_realtime_version' = ''; // Version of speed specification. Currently "2.0"
    'header.timestamp' = ''; // The moment where this dataset was generated on the server.
    'header.incrementality' = ''; // DIFFERENTIAL is unsupported. use FULL_DATASET only
    'entity.id' = ''; // Unique identifier for the entity within the feed update message
    'entity.alert.informed_entity.route_id' = ''; // The route_id from the GTFS that this selector refers to. If direction_id is provided, route_id must also be provided.
    'entity.alert.header_text' = ''; // Header for the alert. This plain-text string will be highlighted, for example in boldface.
    'entity.alert.description_text' = ''; // Description for the alert. This plain-text string will be formatted as the body of the alert (or shown on an explicit "expand" request by the user). The information in the description should add to the information of the header.
  };

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
          // Extract the alerts from thee feed message
          resolve(this.parseAlerts(feedMessage, context));
          break;
        case 'vehicle':
          // Extract vehicle positions from thee feed message
          resolve(this.parseVehiclePositions(feedMessage, context));
          break;

        // Entity invalid
        default:
          resolve(E.left(new Error('Entity invalid in GTFS-RT-Feed. ')));
          break;
      }
    });
  }

  private parseTripUpdates(
    feedMessage: GtfsRealtimeBindings.transit_realtime.FeedMessage,
    context: ExecutionContext,
  ): Promise<Either<Error, Sheet>> {
    return new Promise((resolve) => {
      context.logger.logDebug(`Parsing raw gtfs-rt feed data as TripUpdate"`);
      const rows: string[][] = [];

      // Add header
      rows.push(Object.keys(new this.TripUpdate()));

      for (const entity of feedMessage.entity) {
        if (entity.tripUpdate) {
          if (entity.tripUpdate.stopTimeUpdate) {
            for (const stopTimeUpdate of entity.tripUpdate.stopTimeUpdate) {
              const tripUpdate = new this.TripUpdate();
              tripUpdate['header.gtfs_realtime_version'] =
                feedMessage.header.gtfsRealtimeVersion;
              tripUpdate['header.timestamp'] = String(
                feedMessage.header.timestamp,
              );
              tripUpdate['header.incrementality'] = String(
                feedMessage.header.incrementality,
              );
              tripUpdate['entity.id'] = String(entity.id);
              tripUpdate['entity.trip_update.trip.trip_id'] = String(
                entity.tripUpdate.trip.tripId,
              );
              tripUpdate['entity.trip_update.trip.route_id'] = String(
                entity.tripUpdate.trip.routeId,
              );
              tripUpdate['entity.trip_update.stop_time_update.stop_sequence'] =
                String(stopTimeUpdate.stopSequence);
              tripUpdate['entity.trip_update.stop_time_update.stop_id'] =
                String(stopTimeUpdate.stopId);
              tripUpdate['entity.trip_update.stop_time_update.arrival.time'] =
                String(stopTimeUpdate.arrival?.time);
              tripUpdate['entity.trip_update.stop_time_update.departure.time'] =
                String(stopTimeUpdate.departure?.time);

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

          // Case: No TripUpdates found -> return sheet just with header
        } else {
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
      rows.push(Object.keys(new this.VehiclePosition()));

      for (const entity of feedMessage.entity) {
        if (entity.vehicle) {
          const vehiclePosition = new this.VehiclePosition();
          vehiclePosition['header.gtfs_realtime_version'] =
            feedMessage.header.gtfsRealtimeVersion;
          vehiclePosition['header.timestamp'] = String(
            feedMessage.header.timestamp,
          );
          vehiclePosition['header.incrementality'] = String(
            feedMessage.header.incrementality,
          );
          vehiclePosition['entity.id'] = String(entity.id);
          vehiclePosition['entity.vehicle_position.vehicle_descriptor.id'] =
            String(entity.vehicle.vehicle?.id);
          vehiclePosition['entity.vehicle_position.trip.trip_id'] = String(
            entity.vehicle.trip?.tripId,
          );
          vehiclePosition['entity.vehicle_position.trip.route_id'] = String(
            entity.vehicle.trip?.routeId,
          );
          vehiclePosition['entity.vehicle_position.position.latitude'] = String(
            entity.vehicle.position?.latitude,
          );
          vehiclePosition['entity.vehicle_position.position.longitude'] =
            String(entity.vehicle.position?.longitude);
          vehiclePosition['entity.vehicle_position.timestamp'] = String(
            entity.vehicle.timestamp,
          );
          rows.push(Object.values(vehiclePosition) as string[]);

          // Case: No VehiclePositions found -> return sheet just with header
        } else {
          context.logger.logDebug(
            `Parsing gtfs-rt feed data as VehiclePosition: No VehiclePositions found in feedmessage with timestamp "${String(
              feedMessage.header.timestamp,
            )}"`,
          );
        }
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
      rows.push(Object.keys(new this.Alert()));

      for (const entity of feedMessage.entity) {
        if (entity.alert) {
          if (entity.alert.informedEntity) {
            for (const informedEntity of entity.alert.informedEntity) {
              const alert = new this.Alert();
              alert['header.gtfs_realtime_version'] =
                feedMessage.header.gtfsRealtimeVersion;
              alert['header.timestamp'] = String(feedMessage.header.timestamp);
              alert['header.incrementality'] = String(
                feedMessage.header.incrementality,
              );
              alert['entity.id'] = String(entity.id);
              alert['entity.alert.informed_entity.route_id'] = String(
                informedEntity.routeId,
              );
              alert['entity.alert.header_text'] = String(
                entity.alert.headerText?.translation,
              );
              alert['entity.alert.description_text'] = String(
                entity.alert.descriptionText?.translation,
              );
              rows.push(Object.values(alert) as string[]);
            }
          } else {
            context.logger.logDebug(
              `Parsing gtfs-rt feed data as Alert: InformedEntity of Alert does not contain a single entry. Skipping this Alert and continue with next one"`,
            );
            continue;
          }

          // Case: No Alerts found -> return sheet just with header
        } else {
          context.logger.logDebug(
            `Parsing gtfs-rt feed data as Alert: No Alerts found in feedmessage with timestamp "${String(
              feedMessage.header.timestamp,
            )}"`,
          );
        }
      }
      resolve(E.right(new Sheet(rows)));
    });
  }
}
