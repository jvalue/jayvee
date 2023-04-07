// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PropertyValuetype,
} from '@jvalue/language-server';

export class GtfsRTInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      // How the block type should be called:
      'GtfsRTInterpreter',

      // Attribute definitions:
      {
        entity: {
          type: PropertyValuetype.TEXT,
          docs: {
            description: `Entity to process from GTFS-RT-feed (\`vehiclePosition\`, \`tripUpdate\` or \`alert\`). For example, parsing entity \`tripUpdate\` outputs an \`Sheet\` with header:
            \`\`\`
            [
              "header.gtfs_realtime_version",
              "header.timestamp",
              "header.incrementality",
              "entity.id",
              "entity.trip_update.trip.trip_id",
              "entity.trip_update.trip.route_id",
              "entity.trip_update.stop_time_update.stop_sequence",
              "entity.trip_update.stop_time_update.stop_id",
              "entity.trip_update.stop_time_update.arrival.time",
              "entity.trip_update.stop_time_update.departure.time"
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
  }
}
