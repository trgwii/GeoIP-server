'use strict';

const { isIP } = require('net');
const { join } = require('path');
const { createServer } = require('http');
const { execSync } = require('child_process');

const { lookup, startWatchingDataUpdate } = require('geoip-lite');

const { stringify } = JSON;

startWatchingDataUpdate();

execSync(
	'npm run updatedb',
	{ cwd: join(__dirname, 'node_modules', 'geoip-lite') });

setInterval(() =>
	execSync(
		'npm run updatedb',
		{ cwd: join(__dirname, 'node_modules', 'geoip-lite') }),
1000 * 60 * 60 * 24);

const getIP = req => {
	const param = req.url.slice(1);
	const proxied = req.headers['x-forwarded-for'].split(',')[0].trim();
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
	return res.end(stringify(ok
		? { ok, ip, ...location }
		: (
			res.writeHead(500),
			{ ok, ip, error: 'No results' })));
});

server.listen(process.env.PORT);
