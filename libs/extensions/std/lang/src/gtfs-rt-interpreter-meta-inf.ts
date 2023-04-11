// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { strict as assert } from 'assert';

import {
  BlockMetaInformation,
  IOType,
  PropertyAssignment,
  PropertyValuetype,
  isTextLiteral,
} from '@jvalue/jayvee-language-server';
import { ValidationAcceptor } from 'langium';

export class GtfsRTInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'GtfsRTInterpreter',

      // Attribute definitions:
      {
        entity: {
          type: PropertyValuetype.TEXT,
          validation: isGtfsRTEntity,
          docs: {
            description: `Entity to process from GTFS-RT-feed (\`trip_update\`, \`alert\` or \`vehicle\`).
            We currently support following Output-Sheets:

            Entity tripUpdate:
            \`\`\`
            [
              "header.gtfs_realtime_version", // Version of speed specification. Currently "2.0"
              "header.timestamp", // The moment where this dataset was generated on the server.
              "header.incrementality", // DIFFERENTIAL is unsupported. use FULL_DATASET only
              "entity.id", // Unique identifier for the entity within the feed update message
              "entity.trip_update.trip.trip_id", // The trip_id from the GTFS feed that this selector refers to. Whether trip_id is required depends on the type of trip
              "entity.trip_update.trip.route_id", // The route_id from the GTFS feed that this selector refers to. I
              "entity.trip_update.stop_time_update.stop_sequence", // Must be the same as in stop_times.txt in the corresponding GTFS feed. Either stop_sequence or stop_id must be provided within a StopTimeUpdate - both fields cannot be empty. stop_sequence is required for trips that visit the same stop_id more than once (e.g., a loop) to disambiguate which stop the prediction is for.
              "entity.trip_update.stop_time_update.stop_id", // Must be the same as in stops.txt in the corresponding GTFS feed. Either stop_sequence or stop_id must be provided within a StopTimeUpdate - both fields cannot be empty.
              "entity.trip_update.stop_time_update.arrival.time", // If schedule_relationship is empty or SCHEDULED, either arrival or departure must be provided within a StopTimeUpdate - both fields cannot be empty. arrival and departure may both be empty when schedule_relationship is SKIPPED. If schedule_relationship is NO_DATA, arrival and departure must be empty.
              "entity.trip_update.stop_time_update.departure.time" // If schedule_relationship is empty or SCHEDULED, either arrival or departure must be provided within a StopTimeUpdate - both fields cannot be empty. arrival and departure may both be empty when schedule_relationship is SKIPPED. If schedule_relationship is NO_DATA, arrival and departure must be empty.
            ]
            \`\`\`

            Entity vehiclePosition:
            \`\`\`
            [
              "header.gtfs_realtime_version", // Version of speed specification. Currently "2.0"
              "header.timestamp", // The moment where this dataset was generated on the server.
              "header.incrementality", // DIFFERENTIAL is unsupported. use FULL_DATASET only
              "entity.id", // Unique identifier for the entity within the feed update message
              "entity.vehicle_position.vehicle_descriptor.id", // Internal system identification of the vehicle. Should be unique per vehicle, and is used for tracking the vehicle as it proceeds through the system. This id should not be made visible to the end-user; for that purpose use the label field.
              "entity.vehicle_position.trip.trip_id", // The trip_id from the GTFS feed that this selector refers to. Whether trip_id is required depends on the type of trip
              "entity.vehicle_position.trip.route_id", // The route_id from the GTFS feed that this selector refers to.
              "entity.vehicle_position.position.latitude", // Degrees North, in the WGS-84 coordinate system.
              "entity.vehicle_position.position.longitude", // Degrees East, in the WGS-84 coordinate system.
              "entity.vehicle_position.timestamp" // Moment at which the vehicle's position was measured. In POSIX time (i.e., number of seconds since January 1st 1970 00:00:00 UTC).
              ]
            \`\`\`

            Entity alert:
            \`\`\`
            [
              "header.gtfs_realtime_version", // Version of speed specification. Currently "2.0"
              "header.timestamp", // The moment where this dataset was generated on the server.
              "header.incrementality", // DIFFERENTIAL is unsupported. use FULL_DATASET only
              "entity.id", // Unique identifier for the entity within the feed update message
              "entity.alert.informed_entity.route_id", // The route_id from the GTFS that this selector refers to. If direction_id is provided, route_id must also be provided.
              "entity.alert.header_text", // Header for the alert. This plain-text string will be highlighted, for example in boldface.
              "entity.alert.description_text" // Description for the alert. This plain-text string will be formatted as the body of the alert (or shown on an explicit "expand" request by the user). The information in the description should add to the information of the header.
              ]
            \`\`\`

            `,
          },
        },
      },
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.SHEET,
    );
    this.docs.description =
      'Interprets an protobuf file (binary) of type `File` by decoding the file according to `gtfs-realtime.proto`. Outputs the extracted entity defined by `entity` as a `Sheet`';
    this.docs.examples = [
      {
        code: blockExampleUsage,
        description:
          'A file is interpretet as an GTFS-RT file, which contains trip_updates.',
      },
    ];
  }
}

const blockExampleUsage = `block GtfsRTTripUpdateInterpreter oftype GtfsRTInterpreter{
  entity: "trip_update";
}`;

function isGtfsRTEntity(
  property: PropertyAssignment,
  accept: ValidationAcceptor,
) {
  const propertyValue = property.value;
  assert(isTextLiteral(propertyValue));

  if (!['trip_update', 'alert', 'vehicle'].includes(propertyValue.value)) {
    accept('error', `Entity must be "trip_update", "alert" or "vehicle"`, {
      node: propertyValue,
    });
  }
}
