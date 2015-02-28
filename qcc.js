#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var jsdom = require('jsdom');
var argparse = require('argparse');
var jquery = path.resolve('jquery.js');

var parser = new argparse.ArgumentParser({
	version: '0.0.1',
	addHelp: true,
	description: 'Qualitative coding collector: a qualitative data analysis tool'
});
parser.addArgument(
	['-g', '--guide'],
	{
		help: 'HTML file with highlighted list of terms',
		required: true
	}
);
parser.addArgument(
	['-d', '--directory'],
	{
		help: 'directory containing HTML files with highlighted text',
		required: true
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

	click_listener = '<script>document.getElementById(' + quote_identifier + ').addEventListener("click", function(){window.open("' + args.directory + '/' + filepath + '")});</script>';
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
	this.files_to_highlight.map(function(file){run_in_dom(file, collect_highlighted)});
}

function run_in_dom(file, func) 
{
	func = func || function(){};
	func_wrapper = function(errors, window) {
		filepath = path.basename(window.location._url.path);
		$ = window.jQuery;
		func()
	}
	scripts = (typeof(scripts) === 'undefined') ? 'jquery.js' : scripts;
	jsdom.env({
		file: file,
		scripts: jquery,
		done: func_wrapper
	});
}

function get_files_paths_from_dir(dir) {
	files = fs.readdirSync(dir);
	files = files.filter(function(path){return path != jquery}, files);
	return files.map(function(path){return dir + '/' + path}, files);
}


function write_output(out) {
	html = '<!DOCTYPE html><html lang="en"><head><title>qualitative coding collector</title></head><body>';
	html += out;
	html += '</body></html>';
	fs.writeFile('out.html', html);
}

function write_collected_list_of_quotes(guide, filesdir) {
	files = get_files_paths_from_dir(filesdir); 
	generate_categories = generate_categories.bind({'files_to_highlight': files});	
	run_in_dom(guide, generate_categories);
}

var args = parser.parseArgs();
write_collected_list_of_quotes(args.guide, args.directory);
