# TECK Programmer
Programmer for TECK keyboards.

## Usage

```
$ npm install -g teck-programmer
$ teck-firmware-upgrade firmware.hex
```

Tested on Linux and Mac, but might also work on Windows.
To create custom firmwares for legacy models, visit the old [Custom Layout Designer page](https://trulyergonomic.com/store/layout-designer--configurator--reprogrammable--truly-ergonomic-mechanical-keyboard.html).

### Linux

This program needs direct access to the usb device, which is usually only accessable for root.
Copy `40-teck.rules` into `/etc/udev/rules.d` to automatically give yourself rights on the usb device.

### Mac

No additional configuration needed.

## License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see http://www.gnu.org/licenses/.
