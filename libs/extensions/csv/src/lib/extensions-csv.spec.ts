import { extensionsCsv } from './extensions-csv';

describe('extensionsCsv', () => {
  it('should work', () => {
    expect(extensionsCsv()).toEqual('extensions-csv');
  });
});
