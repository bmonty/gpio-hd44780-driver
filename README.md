This a Node.js module for using an LCD panel with a HD44780 LCD controller.  It is intended to be used in projects that require LCD output and abstracts the setup and operation of the LCD.  This module assumes you are running on hardware with a General Purpose (GPIO) interface such as a Raspberry Pi.  Other hardware platforms are supported if they are supported by the [rpio](https://www.npmjs.com/package/rpio) module.  

The HD44780 must be wired in the 4-bit data mode configuration (i.e DB4 - DB7 are connected and DB0 - DB3 are not).  In addition, the Read/Write signal (R/W) must be pulled low.  The R/W signal is not used by the driver.

gpio-hd44780-driver is intended to be used with Node.js version 8 and higher.

# Installation
```
npm install gpio-hd44780-driver
```

You must have the appropriate packages installed so your platform can compile drivers used by the `rpio` module.

# API

## `gpio-hd44780-driver({config})`

Creates a new `gpio-hd44780-driver` object and intializes the hardware.  When the constructor returns, the HD44780 is ready to accept commands for controlling the display.

The config object is required and has the following options:
```
const config = {
  pinRs: 18,                  /* physical pin connected to the HD44780's register select pin */
  pinEnable: 22,              /* physical pin connected to the HD44780's enable pin */
  pinsData: [11, 12, 15, 16], /* physical pins connected to the HD44780's data bus (DB4 - DB7) */
  lcdColumns: 16,             /* the number of columns on the LCD panel */
  lcdRows: 2                  /* the number of rows on the LCD panel */
}
```

All options are required.

## `clear()`

Clears the LCD panel and resets the cursor position to 0,0.  This function takes some time for the HD44780 to complete and 
it has a built-in 100 msec delay.

## `print(str)`

Sends a string to be displayed on the LCD.  A `\n` in the string will cause the cursor to shift to the start of the next row.

### Example
```
/* shows "Hello!" on the LCD */
lcd.print('Hello!');

/* shows "Hello" on the first row and "World!" on the second row */
lcd.print('Hello\nWorld!');
```

## `setCursor(col, row)`

Explicitly sets the cursor position.

# Usage

The following script can be used to print the words **HD44780 Test!** on the LCD panel:
```
const hd44780 = require('gpio-hd44780-driver');

const lcd = hd44780({
  pinRs: 18,
  pinEnable: 22,
  pinsData: [11, 12, 15, 16],
  lcdColums: 16
  lcdRows: 2
});

lcd.print('HD44780 Test!');
```

This script will show the date and time updated every second:
```
const hd44780 = require('gpio-hd44780-driver');

const lcd = hd44780({
  pinRs: 18,
  pinEnable: 22,
  pinsData: [11, 12, 15, 16],
  lcdColums: 16
  lcdRows: 2
});

setInterval(() => {
  lcd.setCursor(0, 0);

  const now = new Date();
  lcd.print(`${now.toDateString()}\n${now.toTimeString().slice(0,8)}`);
}, 1000);
```

# Contributing

All contributions are welcome using pull requests on GitHub.
