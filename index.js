'use strict';

const { isIP } = require('net');
const { createServer } = require('http');

const { lookup } = require('geoip-lite');

const { stringify } = JSON;

const getIP = req => {
	const proxied = req.headers['x-forwarded-for'].split(',')[0].trim();
	const param = req.url.slice(1);
	const remote = req.connection.remoteAddress;
	return (
		isIP(param)
			? param :
		isIP(proxied)
			? proxied :
		remote.startsWith('::ffff:')
			? remote.split(':').pop() :
		remote);
};

const server = createServer((req, res) => {
	const ip = getIP(req);
	const location = lookup(ip);
	const ok = Boolean(location);
	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Access-Control-Allow-Origin', '*');
	return res.end(stringify(location
		? { ok, ip, ...location }
		: (
			res.writeHead(500),
			{ ok, ip, error: 'No results' })));
});

server.listen(process.env.PORT);
