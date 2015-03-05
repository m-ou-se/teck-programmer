module.exports.parse = function(ihex_source) {
	var line_nr = 0;
	var buffer = Buffer(1024);
	var buffer_length = 0;
	var file_ended = false;
	ihex_source.split('\n').forEach(function(line) {
		line = line.replace(/\r$/, '');
		++line_nr;
		if (line == '') return;
		if (file_ended) throw new Error('Unexpected data after end of file record on line ' + line_nr + '.');
		if (line[0] != ':') throw new Error("Line " + line_nr + " doesn't start with a ':'.");
		try {
			line = Buffer(line.substr(1), 'hex');
			var length = line.readUInt8(0);
			if (length + 5 != line.length) throw new Error('Line length does not match.');
			var sum = 0;
			for (var i = 0; i < line.length; ++i) sum = (sum + line[i]) & 0xFF;
			if (sum != 0) throw new Error('Invalid checksum.');
			var address = line.readUInt16BE(1);
			var type = line.readUInt8(3)
			var data = line.slice(4, 4 + length);
		} catch (e) {
			throw new Error('Invalid data on line ' + line_nr + ': ' + e);
		}
		if (type == 0) { // Data
			var end = address + length;
			if (end > buffer_length) {
				if (end > buffer.length) {
					var new_size = buffer.length;
					while (new_size < end) new_size *= 2;
					var b = Buffer(new_size);
					buffer.copy(b);
					buffer = b;
				}
				buffer.fill(0, buffer_length, end);
				buffer_length = end;
			}
			data.copy(buffer, address);
		} else if (type == 1) { // End of file
			file_ended = true;
		} else {
			throw new Error('Unknown record type ' + type + ' on line ' + line_nr);
		}
	});
	if (!file_ended) throw new Error('Missing end of file record.');
	return buffer.slice(0, buffer_length);
};
