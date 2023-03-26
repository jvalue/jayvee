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
            description:
              'Entity to process from GTFS-RT-feed. Could be `vehiclePosition`, `tripUpdate` or alert.',
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
