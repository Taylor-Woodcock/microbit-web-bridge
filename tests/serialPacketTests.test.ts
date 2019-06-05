import {SerialPacket} from '../src/SerialPacket';

describe('decode payload', function() {
    it('wrong message decode', function() {
      let rawPayload = ' 9ÛÝ/share/historicalData/ 34 gl2 gl celsius À';
      let result = SerialPacket.dataToSerialPacket(rawPayload);
      console.log(result);
      expect(result.payload).toMatchObject(["/share/historicalData/", "34", "gl2", "gl", "celsius"]);
    })
    it('correct message decode', function(){
      let rawPayload = ' ?h/share/historicalData/ 35 gl1 gl celsius À';
      let result = SerialPacket.dataToSerialPacket(rawPayload);
      console.log(result);
      expect(result.payload).toMatchObject(["/share/historicalData/", "35", "gl1", "gl", "celsius"]);
    })
});