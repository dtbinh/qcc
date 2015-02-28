#!/usr/bin/env node
var argparse = require('argparse');
var open = require('open');
var http = require('http');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var parser = new argparse.ArgumentParser({
	version: '0.0.1',
	addHelp: true,
	description: 'Tool to generate authentication URL for the OAuth 2.0 Google API',
	epilog: '`./generate-google-auth-url.js -i CLIENT_ID -s CLIENT_SECRET --silent`'
});
parser.addArgument(
	['-i', '--google-client-id'],
	{
		help: 'Client ID found in your Google Developer Console',
		required: true
	}
);
parser.addArgument(
	['-s', '--google-client-secret'],
	{
		help: 'Client secret found in your Google Developer Console',
		required: true
	}
);
parser.addArgument(
	['-S', '--silent'],
	{
		help: 'Only output export statements.',
		action: 'storeTrue'
	}
);
var args = parser.parseArgs();

var oauth2Client = new OAuth2(args.google_client_id, args.google_client_secret, 'http://localhost:6541');


function getTokens(request)
{
	var url = require('url');
	var code = url.parse(request.url, true).query.code;
	if (code) {
		if (!args.silent) {
			console.log('Will now retrieve tokens..');
		}
		oauth2Client.getToken(code, function(error, tokens) {
			if (error) {
				throw error;
			}
			if (!args.silent) {
				console.log('Put these into your environment:');
			}
			console.log('export GOOGLE_CLIENT_ID="' + args.google_client_id +  '"');
			console.log('export GOOGLE_CLIENT_SECRET="' + args.google_client_secret + '"');
			console.log('export GOOGLE_ACCESS_TOKEN="' + tokens.access_token +  '"');
			console.log('export GOOGLE_REFRESH_TOKEN="' + tokens.refresh_token + '"');
			process.exit();
		});
	}
}

html = '<!DOCTYPE html><html><head><title>Redirect page</title></head><body>Authentication complete. Close this window and return to your shell.</body></html';
var server = http.createServer(function(request, response) {
	response.writeHead(200, {"Content-Type": "text/html"});
	response.write(html);
	response.end();
	server.close();

	getTokens(request);

});

function getAuthUrl(oauth2Client)
{
	return oauth2Client.generateAuthUrl({
		access_type: 'offline', 
		scope: 'https://www.googleapis.com/auth/drive.readonly'
	});
}

var url = getAuthUrl(oauth2Client);
server.listen(6541);
if (!args.silent) {
	console.log('Now trying to open a browser window to authentication URL:\n' + url + '\r\n');
}
open(url);
