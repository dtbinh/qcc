#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var argparse = require('argparse');
var google = require('googleapis');
var jsdom = require('jsdom');
var jquery = 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js';

var parser = new argparse.ArgumentParser({
	version: '0.0.1',
	addHelp: true,
	description: 'Qualitative coding collector: a qualitative data analysis tool',
	epilog: 'Example: ./qcc.js -g examples/guide.html -d examples/transcripts/'
});
parser.addArgument(
	['-g', '--guide'],
	{
		help: 'HTML file with highlighted list of terms or Google Drive fileId',
		required: true
	}
);
parser.addArgument(
	['-t', '--texts'],
	{
		help: 'List of highlighted texts. Input can be either a directory, a text file with each item on separate line or multiple arguments. Valid input is paths to HTML files or Google Drive file IDs',
		required: true,
		action: 'append'

	}
);
parser.addArgument(
	['-i', '--google-client-id'],
	{
		help: 'Client ID found in your Google Developer Console'
	}
);
parser.addArgument(
	['-s', '--google-client-secret'],
	{
		help: 'Client secret found in your Google Developer Console'
	}
);
parser.addArgument(
	['-a', '--google-client-access'],
	{
		help: 'Access token retrieved from oauth2Client.getToken (run generate-google-auth-url.js)'
	}
);
parser.addArgument(
	['-r', '--google-client-refresh'],
	{
		help: 'Refresh token retrieved from oauth2Client.getToken (run generate-google-auth-url.js)'
	}
);
parser.addArgument(
	['-o', '--output'],
	{
		help: 'output HTML file',
		defaultValue: 'out.html'
	}
);
var context = {};

function djb2(str)
{
	var out = 5381;
	return str.split('').reduce(function(p, c){
		return ((p << 5) + p) + c.charCodeAt(0)
	}, out);
}

function create_html_from_filepaths(filepath)
{
	var out = Object.keys(filepath).map(function(k) {return filepath[k] + '<br><br>'});
	return out.reduce(function(p, q) {return p + q}, '');
}

function create_html_from_category(category)
{
	var out = Object.keys(category).map(function(k) {return '<h2>' + k + '</h2>' + create_html_from_filepaths(category[k])});
	return out.reduce(function(p, q) {return p + q}, '');
}

function create_html_from_context()
{
	out = Object.keys(context).map(function(k) {
		colorcode = Object.keys(categories).filter(function(c) {return categories[c] == k});
		color_tag = ' <span style="font-size: 12px; background-color: ' + colorcode + '">' + colorcode + '</span>';
		return '<h1 id=' + djb2(k) + '>' + k + color_tag + '</h1>' + create_html_from_category(context[k])}
	);
	return out.reduce(function(p, q) {return p + q}, '');
}

function set_inline_background_color() {
	self.css('background-color', colorcode); 
}

function add_file_path_if_not_yet_in_category()
{
	if (typeof(context[category][filepath]) == 'undefined') {
		context[category][filepath] = {};
	}
}

function add_quote_if_not_yet_in_category()
{
	quoteblock = self.parent();
	quote_identifier = djb2(quoteblock.text());

	highlighted = $('span[class^=c]', quoteblock);
	highlighted.each(function(){
		self = $(this);
		colorcode = self.css('background-color');
	});

	click_listener = '<script>document.getElementById(' + quote_identifier + ').addEventListener("click", function(){window.open("' + args.texts + '/' + filepath + '")});</script>';
	quote_html = '<span id=' + quote_identifier + '>' + quoteblock.html() + '</span>';
	context[category][filepath][quote_identifier] = quote_html + click_listener;
}

function add_category_if_not_yet_in_context()
{
	if (typeof(context[category]) == 'undefined') {
		context[category] = {};
	}
}

function add_quote_to_context()
{
	add_category_if_not_yet_in_context();
	add_file_path_if_not_yet_in_category();
	add_quote_if_not_yet_in_category();
}


function collect_highlighted()
{
	categories = this.categories;
	highlighted = $('span[class^=c]');
	highlighted.each(function(){
		self = $(this);
		colorcode = self.css('background-color');
		set_inline_background_color();
	});
	highlighted.each(function(){
		self = $(this);
		colorcode = self.css('background-color');
		if (colorcode.length) {
			if (category = categories[colorcode]) {
				add_quote_to_context();
			}
		}
	});
	html = create_html_from_context();
	write_output(html);
}

function generate_categories() 
{
	var categories = [];
	colors = $('span[class^=c]');
	colors.each(function(){
		self = $(this);
		colorcode = self.css('background-color');
		if (colorcode.length > 0) {
			category = self.text();
			categories[colorcode] = category;
		}
	});
	collect_highlighted = collect_highlighted.bind({'categories': categories});
	console.log('Starting highlight collection..');
	this.files_to_highlight.map(function(file){run_in_dom(file, collect_highlighted)});
}

function get_html_url_from_google_drive(guide, callback) 
{
	if (!G_ID || !G_SECRET || !G_ACCESS || !G_REFRESH) {
		throw new Error('Must provide OAuth 2.0 credentials to use Google Drive API!');
	}
	var OAuth2 = google.auth.OAuth2;
	var oauth2Client = new OAuth2(args.google_client_id, args.google_client_secret, 'http://localhost');
	oauth2Client.setCredentials({
		access_token: G_ACCESS,
		refresh_token: G_REFRESH
	});
	var drive = google.drive({version: 'v2', auth: oauth2Client});

	console.log('Getting HTML export URL from Google Drive API');
	file = drive.files.get({'fileId': guide}, function(error, response){
		if (error) {
			throw error;
		}	
		url = response['exportLinks']['text/html'];
		console.log('Retrieved export URL');
		callback(url);
	});
}

function run_in_dom(file, func) 
{
	_jsdom_wrapper = function(file){
		func = func || function(){};
		func_wrapper = function(errors, window) {
			filepath = path.basename(window.location._url.path);
			console.log('Loading jQuery into ' + file);
			$ = window.jQuery;
			func()
		}
		scripts = (typeof(scripts) === 'undefined') ? 'jquery.js' : scripts;
		console.log('Creating DOM from ' + file);
		config = {
			scripts: jquery,
			done: func_wrapper
		}
		if (file.substring(0, 4)  == 'http') {
			config.url = file
		} else {
			config.file = file
		}
		jsdom.env(config);
	};
	fs.existsSync(file) ? _jsdom_wrapper(file) : get_html_url_from_google_drive(file, _jsdom_wrapper);
}

function get_files_from_input(files_input) 
{
	first_item = files_input[0];
	if (fs.existsSync(first_item)){
		if (fs.lstatSync(first_item).isDirectory()) {
			files = fs.readdirSync(first_item);
			return files.map(function(path){return first_item + path}, files);
		} else {
			return files = fs.readFileSync(files_input[0]).tosString().split('\n');
		}
	} else {
		return files = files_input;
	}
}


function write_output(out) 
{
	html = '<!DOCTYPE html><html lang="en"><head><title>qualitative coding collector</title></head><body>';
	html += out;
	html += '</body></html>';
	fs.writeFile('out.html', html);
}

function write_collected_list_of_quotes(guide, filesdir) 
{
	console.log('resolving file in ' + filesdir);
	files = get_files_from_input(filesdir); 
	generate_categories = generate_categories.bind({'files_to_highlight': files});	
	console.log('generating categories from ' + guide);
	run_in_dom(guide, generate_categories);
}

var args = parser.parseArgs();
var G_ID = args.google_client_id ? args.google_client_id : process.env.GOOGLE_CLIENT_ID;
var G_SECRET = args.google_client_secret ? args.google_client_secret : process.env.GOOGLE_CLIENT_SECRET;
var G_ACCESS = args.google_client_access ? args.google_client_access : process.env.GOOGLE_ACCESS_TOKEN;
var G_REFRESH = args.google_client_refresh ? args.google_client.refresh : process.env.GOOGLE_REFRESH_TOKEN;

write_collected_list_of_quotes(args.guide, args.texts);
