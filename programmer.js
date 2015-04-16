var usb = require('usb');
var Q = require('q');

// 0x<vendor><product>
var normal_mode_id = 0x0E6A030C;
var program_mode_id = normal_mode_id - 1;

function claim_interface(device) {
	device.open();
	var interface = device.interface(0);
	try { interface.detachKernelDriver(); } catch(e) {}
	try { interface.claim(); } catch(e) {}
}

function send_packet(device, data) {
	var bmRequestType = usb.LIBUSB_ENDPOINT_OUT | usb.LIBUSB_REQUEST_TYPE_CLASS | usb.LIBUSB_RECIPIENT_INTERFACE;
	var bRequest = 9;
	var wValue = 0x0300;
	var wIndex = 0;
	return Q.nbind(device.controlTransfer, device)(
		bmRequestType, bRequest, wValue, wIndex, data
	);
}

function receive_packet(device) {
	var bmRequestType = usb.LIBUSB_ENDPOINT_IN | usb.LIBUSB_REQUEST_TYPE_CLASS | usb.LIBUSB_RECIPIENT_INTERFACE;
	var bRequest = 1;
	var wValue = 0x0300;
	var wIndex = 0;
	return Q.nbind(device.controlTransfer, device)(
		bmRequestType, bRequest, wValue, wIndex, 64
	);
}

module.exports = {
	list_devices: function() {
		var devices = [];
		usb.getDeviceList().forEach(function(dev) {
			var id = dev.deviceDescriptor.idVendor << 16 | dev.deviceDescriptor.idProduct;
			if (id == normal_mode_id || id == program_mode_id) {
				devices.push({
					device: dev,
					mode: (id == normal_mode_id ? 'normal' : 'program'),
				});
			}
		});
		return Q(devices);
	},
	// Switches the device from normal mode to program mode or back.
	switch_mode: function(device) {
		claim_interface(device);
		var data = new Buffer(64);
		data.fill(0);
		data[0] = 0x44;
		return send_packet(device, data);
	},
	// Programs the device (which must be in program mode) with the given firmware (Buffer).
	program: function(device, firmware) {
		claim_interface(device);
		var data = new Buffer(64);
		data.fill(0);
		data[0] = 0x33;
		data.writeUInt16BE(firmware.length, 5);
		var i = 0;
		return send_packet(device, data).then(function next() {
			var data = firmware.slice(i, i + 64);
			i += data.length;
			if (data.length != 64) {
				var d = new Buffer(64);
				d.fill(0);
				data.copy(d);
				data = d;
			}
			var s = send_packet(device, data);
			if (i < firmware.length) s = s.then(next);
			return s;
		}).then(function() {
			var data = new Buffer(64);
			data.fill(0);
			data[0] = 0x22;
			data[6] = 0x02;
			return send_packet(device, data);
		}).then(function() {
			return receive_packet(device);
		}).then(function(response) {
			var checksum = 0;
			for (var i = 0; i < firmware.length; ++i) checksum = (checksum + firmware[i]) & 0xFFFF;
			if (response.readUInt16BE(0) != checksum) throw new Error('Programming failed: Response contains invalid checksum.');
		});
	},
	// Release the interface and try to reattach the kernel driver.
	release: function(device) {
		return Q().then(function() {
			var interface = device.interface(0);
			return Q.nbind(interface.release, interface)(true).then(function() {
				interface.attachKernelDriver();
			});
		}).catch(function(){});
	}
}
