'use strict';

const { isIP } = require('net');
const { createServer } = require('http');

const { lookup } = require('geoip-lite');

const { stringify } = JSON;

const getIP = req => {
	const param = req.url.slice(1);
	const remote = req.connection.remoteAddress;
	return (
		isIP(param)
			? param :
		remote.startsWith('::ffff:')
			? remote.split(':').pop() :
		remote);
};

const server = createServer((req, res) => {
	return res.end(stringify(lookup(getIP(req)) || (
		res.writeHead(500),
		{ error: 'No results' })));
});

server.listen(process.env.PORT);
