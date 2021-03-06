import {DAPLink} from "dapjs";
import {RequestStatus, RequestType, SerialPacket, SlipChar} from "./SerialPacket";
import {debug, DebugType} from "./Debug";
import {RequestHandler} from "./RequestHandler";
import {DEBUG} from "./constants/Config";

export class SerialHandler {
    private targetDevice: DAPLink;
    private baud: number;
    private readonly hubVariables: {};
    private packetCount: number;
    private isPaused: boolean;

    /***
     * Creates a SerialHandler with a chosen DAPLink target and a baud given rate.
     *
     * @param targetDevice DAPLink target device to connect to
     * @param hubVariables Variables stored for communication of the hub
     * @param baud Baud rate of the serial communication (Default: 115200)
     */
    constructor(targetDevice: DAPLink, hubVariables: {}, baud = 115200) {
        this.targetDevice = targetDevice;
        this.baud = baud;
        this.hubVariables = hubVariables;
        this.packetCount = 0;
        this.isPaused = false;

        this.setupSerialHandler();
    }

    public async write(serialPacket: SerialPacket) {
        this.targetDevice.stopSerialRead()
        this.pause();
        await this.sendSerialPacket(serialPacket);
        this.play();
        this.targetDevice.startSerialRead(this.hubVariables['serial_delay']);
    }
    
    /***
     * Adds an event listener to the DAPLink target to listen to serial events and process the data
     */
    private async setupSerialHandler() {
        this.targetDevice.on(DAPLink.EVENT_SERIAL_DATA, data => {
            // if serial handling is paused, dont perform any actions
            if(this.isPaused)
                return;

            if (data.search(String.fromCharCode(SlipChar.SLIP_END)) === -1 || data.charCodeAt(0) !== 0) {
                return;
            }

            this.packetCount++;
            debug(`Packet count: ${this.packetCount}`, DebugType.DEBUG);

            let serialPacket: SerialPacket;

            try {
                let requestHandler = new RequestHandler(this.hubVariables); // create a RequestHandler to handle this request
                serialPacket = SerialPacket.dataToSerialPacket(data); // convert the data to a SerialPacket

                if(DEBUG) {
                    console.log("Input Packet: ");

                    let rawPacket = [];
                    for (let i = 0; i < data.length; i++) {
                        rawPacket.push(data.charCodeAt(i));
                    }
                    console.log(data);
                    console.log(rawPacket);
                    console.log(serialPacket);
                }

                // handle the request and await the promised resolve packet or reason for error
                requestHandler.handleRequest(serialPacket)
                    .then((responsePacket) => {
                        responsePacket.setRequestBit(RequestStatus.REQUEST_STATUS_OK);
                        this.write(responsePacket);
                    })
                    .catch((reason) => {
                        debug(`${reason}`, DebugType.ERROR);

                        // clear all data from input packet and return it as an error packet
                        let responsePacket = new SerialPacket(serialPacket.getAppID(), serialPacket.getNamespaceID(), serialPacket.getUID(), serialPacket.getReqRes());
                        responsePacket.clearAndError(reason);
                        this.write(responsePacket);
                    });
            } catch (e) {
                console.log(e);

                // clear serial packet and try to send an error response
                serialPacket.clearAndError("ERROR");
                this.write(serialPacket);
            }
        });
    }

    /***
     * Sends a SerialPacket to the device via serial communication in the correct format required.
     *
     * @param serialPacket Serial packet to send to bridge micro:bit
     */
    public async sendSerialPacket(serialPacket: SerialPacket) {
        if(DEBUG) {
            console.log("Output Packet");
            console.log(serialPacket);
            console.log(serialPacket.getFormattedPacket());
        }

        let packet = String.fromCharCode(...serialPacket.getFormattedPacket());

        try {
            await this.targetDevice.serialWrite(packet);
        } catch(e) {
            console.log(e);
        }
    }

    /***
     * Sends a sad face to the bridge micro:bit
     */
    public sendSadFace() {
        let responsePacket = new SerialPacket(0, 0, 0, RequestType.REQUEST_TYPE_HELLO);
        responsePacket.append(-1);
        this.write(responsePacket);
    }

    /***
     * Sends a happy face to the bridge micro:bit
     */
    public sendHappyFace() {
        let responsePacket = new SerialPacket(0, 0, 0, RequestType.REQUEST_TYPE_HELLO);
        responsePacket.append(0);
        this.write(responsePacket);
    }

    /***
     * Pauses the serial handler for other serial communication (e.g. flashing).
     */
    public pause() {
        this.isPaused = true;
    }

    /***
     * Pauses the serial handler for other serial communication (e.g. flashing).
     */
    public play() {
        this.isPaused = false;
    }
}