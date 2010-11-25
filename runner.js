#!/usr/bin/env node
// Command script
var fs = require('fs');
var http = require('http');
var cfg = require('./config');

var ddoc_uri = '/'+cfg.db_name+'/_design/cinker/';

var couchdb = http.createClient(5984, cfg.db_host);
var req = couchdb.request('GET', ddoc_uri+'_view/profiles?group=true');

req.end();

req.on('response', function(response) {
  response.setEncoding('utf8');
  var body = '';
  response.on('data', function (chunk) {
    body += chunk;
  });
  response.on('end', function(chunk) {
    var rows = JSON.parse(body)['rows'];
    for (ri in rows) {
      console.log(rows[ri]['key'][1]);
    }
  });
});
