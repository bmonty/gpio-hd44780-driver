const rpio = require('rpio');

const command = {
    CLEARDISPLAY: 0x01,
    HOME: 0x02,
    ENTRYMODESET: 0x04,
    DISPLAYCONTROL: 0x08,
    CURSORSHIFT: 0x10,
    FUNCTIONSET: 0x20,
    SETCGRAMADDR: 0x40,
    SETDDRAMADDR: 0x80
};

const entryModeFlags = {
    ENTRYRIGHT: 0x00,
    ENTRYLEFT: 0x02,
    ENTRYSHIFTINCREMENT: 0x01,
    ENTRYSHIFTDECREMENT: 0x00
};

const controlFlags = {
    DISPLAYON: 0x04,
    DISPLAYOFF: 0x00,
    CURSORON: 0x02,
    CURSOROFF: 0x00,
    BLINKON: 0x01,
    BLINKOFF: 0x00
};

const moveFlags = {
    DISPLAYMOVE: 0x08,
    CURSORMOVE: 0x00,
    MOVERIGHT: 0x04,
    MOVELEFT: 0x00
};
const ROWOFFSETS = [0x00, 0x40, 0x14, 0x54];

const functionSetFlags = {
    EIGHTBITMODE: 0x10,
    FOURBITMODE: 0x00,
    TWOLINE: 0x08,
    ONELINE: 0x00,
    FIVEBYTENDOTS: 0x04,
    FIVEBYEIGHTDOTS: 0x00
};

module.exports = class {
    /**
     * Creates a new Lcd class.  The constructor takes an object with information
     * on your LCD's size and how it is connected to GPIO.
     * 
     * The pins for the data bus as specified as an Array.  For example, if GPIO pins
     * 11, 12, 15, and 16 are connected to the HD44780's pins 11-14, the `pinsData`
     * parameter would be:
     * `
     * pinsData = [11, 12, 15, 16];
     * `
     * 
     * @param config.pinRs the GPIO pin connected to Register Select (pin 4 on the HD44780)
     * @param config.pinEnable the GPIO pin connected to Enable (pin 6 on the HD44780)
     * @param config.pinsData the GPIO pins connected to the data bus as an Array (pins 11-14 on the HD44780)
     * @param config.lcdColums the number of columns the LCD panel has
     * @param config.lcdRows the number of rows the LCD panel has
     */
    constructor(config) {
        this.pinRs = config.pinRs;
        this.pinEnable = config.pinEnable;
        this.pinsData = config.pinsData;
        this.lcdColumns = config.lcdColumns;
        this.lcdRows = config.lcdRows;

        // setup GPIO pins
        rpio.open(this.pinRs, rpio.OUTPUT, rpio.LOW);
        rpio.open(this.pinEnable, rpio.OUTPUT, rpio.LOW);
        this.pinsData.forEach((pin) => {
            rpio.open(pin, rpio.OUTPUT, rpio.LOW);
        });

        // send the HD44780's reset sequence
        this._write8Bits(0x33, false, 1, 4100);
        this._write8Bits(0x32, false, 1, 100);

        // write registers
        this._write8Bits(command.DISPLAYCONTROL | controlFlags.DISPLAYON | controlFlags.CURSOROFF | controlFlags.BLINKOFF);
        this._write8Bits(command.FUNCTIONSET | functionSetFlags.FOURBITMODE | functionSetFlags.TWOLINE | functionSetFlags.FIVEBYEIGHTDOTS);
        this._write8Bits(command.ENTRYMODESET | entryModeFlags.ENTRYLEFT | entryModeFlags.ENTRYSHIFTDECREMENT);
        
        this.clear();
    }

    /**
     * Clears the entire display and moves the cursor to 0,0.
     */
    clear() {
        this._write8Bits(command.CLEARDISPLAY);
    }

    /**
     * Sends a string to be printed on the LCD. A '\n' in the string
     * will cause the cursor to shift to the start of the next row.
     * 
     * @param str the string to send to the LCD 
     */
    print(str) {
        var row = 0;
        Array.from(str).forEach(char => {
            if (char === '\n') {
                row += 1;
                this.setCursor(0, row);  
            } else {
                this._write8Bits(char.charCodeAt(0), true);
            }
        });
    }

    /**
     * Explicitly set the cursor position.
     * 
     * @param col the column, starting from zero
     * @param row the row, starting from zero
     */
    setCursor(col, row) {
        // clamp row to the last row of the display
        const r = row > this.lcdRows - 1 ? this.lcdRows - 1 : row;
        // set location
        this._write8Bits(command.SETDDRAMADDR | (col + ROWOFFSETS[r]));
    }

    /**
     * Writes an 8-bit value to the LCD using the 4-bit transfer mode.
     * 
     * @param value the value to write 
     * @param registerSelect register select state, `false` (default) to write commands and `true` for data 
     * @param writeWait the time to wait between writes, min 37 microseconds from spec
     * @param initWait set to true if writing the init sequence, adds the required extra time between writes
     */
    _write8Bits(value, registerSelect=false, writeWait=50, initWait=0) {
        // wait 50 microseconds to prevent writing too quickly
        rpio.usleep(writeWait);
        
        // set the R/W pin
        if (registerSelect) {
            rpio.write(this.pinRs, rpio.HIGH);
        } else {
            rpio.write(this.pinRs, rpio.LOW);
        }

        // write upper 4 bits
        var i;
        for (i = 0; i < 4; i++) {
            rpio.write(this.pinsData[i], ((value >> i + 4) & 1));
        }
        this._pulseEnable();

        // if this write is for initialization of the HD44780, there must
        // be a pause of at least 4.1ms between the two writes.
        if (initWait) {
            rpio.usleep(initWait);
        }

        // write lower 4 bits
        for (i = 0; i < 4; i++) {
            rpio.write(this.pinsData[i], ((value >> i) & 1));
        }
        this._pulseEnable();
    }

    /**
     * Pulse the enable pin to tell the HD44780 to read data from the data bus.
     * Pin is held high for 1 microsecond.
     */
    _pulseEnable() {
        rpio.write(this.pinEnable, rpio.LOW);
        rpio.usleep(1);
        rpio.write(this.pinEnable, rpio.HIGH);
        rpio.usleep(1);
        rpio.write(this.pinEnable, rpio.LOW);
        rpio.usleep(1);
    }
}

