# TECK Programmer
Programmer for TECK keyboards.

## Usage

```
$ node main.js firmware.hex
```

Tested only on Linux, but probably also works on Windows and Mac.

### Linux

This program needs direct access to the usb device, which is usually only accessable for root.
Copy `40-teck.rules` into `/etc/udev/rules.d` to automatically give yourself rights on the usb device.
