# TECK Programmer
Programmer for TECK keyboards.

## Usage

```
$ npm install -g teck-programmer
$ teck-firmware-upgrade firmware.hex
```

Tested only on Linux, but might also work on Windows. It doesn't work on Mac.

### Linux

This program needs direct access to the usb device, which is usually only accessable for root.
Copy `40-teck.rules` into `/etc/udev/rules.d` to automatically give yourself rights on the usb device.
