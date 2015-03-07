#!/usr/bin/env node

var fs = require('fs');
var Q = require('q');

var ihex = require('./ihex');
var programmer = require('./programmer');

var filename = process.argv[2];

if (filename === undefined) {
	console.log("Usage: teck-firmware-upgrade <hex file>");
	process.exit(0);
}

var firmware = Q.nfcall(fs.readFile, filename, "ascii").then(ihex.parse).catch(function(err) {
	throw new Error('Unable to read hex file: ' + err.message);
});

var device = firmware.then(function() {
	var did_switch = false;
	function find_device() {
		return programmer.list_devices().then(function(devs) {
			if (devs.length == 0) throw new Error('No devices found.');
			if (devs.length > 1) throw new Error('More than one device found.');
			console.log('Found device in ' + devs[0].mode + ' mode on bus ' + devs[0].device.busNumber + ', device ' + devs[0].device.deviceAddress + '.');
			return devs[0];
		}).then(function(dev) {
			if (dev.mode == 'normal') {
				if (did_switch) {
					console.log('Device did not switch to program mode.');
					return programmer.release(dev.device).then(function() {
						throw new Error('Unable to set device in program mode. Is the firmware protection switch on?');
					});
				}
				console.log('Switching to program mode.');
				did_switch = true;
				return programmer.switch_mode(dev.device).then(function() {
					console.log('Rescanning for devices in one second.');
					return Q().delay(1000).then(find_device);
				});
			} else {
				return dev.device;
			}
		});
	};
	return find_device();
});

Q.all([firmware, device]).spread(function(firmware, device) {
	console.log('Uploading firmware.');
	return programmer.program(device, firmware).then(function() {
		console.log('Uploading done.');
		console.log('Switching back to normal mode.');
		return programmer.switch_mode(device)
	});
}).then(function() {
	console.log('Done.');
}).catch(function(err) {
	console.log(err.toString());
	process.exit(1);
});
