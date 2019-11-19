import { SerialPacket } from '../src/SerialPacket';

describe('decode payload', function () {
  it('wrong message decode', function () {
    let bytes = [
      0, 1, 57, 219, 221, 2, // HEADER
      // PAYLOAD
      1, 47, 115, 104, 97, 114, 101, 47, 104, 105,
      115, 116, 111, 114, 105, 99, 97, 108, 68, 97,
      116, 97, 47, 0, 1, 51, 52, 0, 1, 103, 108, 50,
      0, 1, 103, 108, 0, 1, 99, 101, 108, 115, 105,
      117, 115, 0, 192
    ];
  
    let rawPayload = '';
    for (let i = 0; i < bytes.length; i++) {
      rawPayload += (String.fromCharCode(bytes[i]))
    }
    let result = SerialPacket.dataToSerialPacket(rawPayload);
    expect(result.payload).toMatchObject(["/share/historicalData/", "34", "gl2", "gl", "celsius"]);
  })
  it('correct message decode', function () {
    let bytes = [
      0, 1, 63, 104, 2, // HEADER correct
      // PAYLOAD
      1, 47, 115, 104, 97, 114, 101, 47, 104, 105,
      115, 116, 111, 114, 105, 99, 97, 108, 68, 97,
      116, 97, 47, 0, 1, 51, 53, 0, 1, 103, 108, 49,
      0, 1, 103, 108, 0, 1, 99, 101, 108, 115, 105,
      117, 115, 0, 192 
    ];
    let rawPayload = '';
    for (let i = 0; i < bytes.length; i++) {
      rawPayload += (String.fromCharCode(bytes[i]))
    }
    let result = SerialPacket.dataToSerialPacket(rawPayload);
    expect(result.payload).toMatchObject(["/share/historicalData/", "35", "gl1", "gl", "celsius"]);
  })
});