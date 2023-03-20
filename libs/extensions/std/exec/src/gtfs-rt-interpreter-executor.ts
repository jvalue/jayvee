import * as R from '@jvalue/execution';
import { BlockExecutor, File, Sheet } from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import * as GtfsRealtimeBindings from 'gtfs-realtime-bindings';

export class GtfsRTInterpreterExecutor extends BlockExecutor<
  IOType.FILE,
  IOType.SHEET
> {
  constructor() {
    // Needs to match the name in meta information:
    super('GtfsRTInterpreter', IOType.FILE, IOType.SHEET);
  }

  override async execute(inputFile: File): Promise<R.Result<Sheet>> {
    // Accessing attribute values by their name:
    const entity = this.getStringAttributeValue('entity');

    //https://github.com/MobilityData/gtfs-realtime-bindings/tree/master/nodejs
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(inputFile.content),
    );
    // TODO: Parse all possible feedentity to table

    let val = 1;
    // TODO: Error
    // eslint-disable-next-line no-constant-condition
    if (val === 1) {
      return R.err({
        message: 'The specified cell range does not fit the sheet',
        diagnostic: { node: this.block, property: 'name' },
      });
    }
    val++;

    return R.ok(null as unknown as Sheet);
  }
}
