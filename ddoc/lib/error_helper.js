// Error helper

// What the client is looking for, hasn't changed
var NotModifiedError = function(msg){
  this.name = 'not modified';
  this.code = 304;
  this.no_body = true;
  this.message = msg;
}

// Something from the client is missing or invalid
var UserError = function(msg){
  this.name = 'user error';
  this.code = 400;
  this.message = msg;
}

// Unsupported/Invalid HTTP method used
var MethodError = function(msg){
  this.name = 'method error';
  this.code = 405;
  this.message = msg;
}

// Something from the client is conflicting with exsisting data
var ConflictError = function(msg){
  this.name = 'user error';
  this.code = 409;
  this.message = msg;
}

// Generic exception handler for updates
var bail = function(e){
    var ret = {};
    if(!e.no_body)
      ret.body = JSON.stringify({error:e.name, reason:e.message})+'\n';
    ret.code = e.code || 500;
    return [null, ret];
}
