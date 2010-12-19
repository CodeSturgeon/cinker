require 'json'
require 'uri'

Given /^a doc_id of "(.*?)"$/ do |doc_id|
  @doc_id = doc_id
end

Given /^a profile of "([^"]*)"$/ do |profile|
  @profile = profile
end

Given /^a path of "([^"]*)"$/ do |path|
  @path = path
end

Given /^a target_attr of "([^"]*)"$/ do |target_attr|
  @target_attr = target_attr
end

Given /^there is a document called "([^"]*)"$/ do |doc_id|
  resp = $couch.get("/#{$db_name}/#{doc_id}")
  raise "did not get the expected 200: #{resp}" unless resp.code.to_i == 200
end

Then /^the response code should be "([^"]*)"$/ do |code|
  resp_code = @presp['code'].to_s
  raise "wrong code: #{resp_code} != #{code}" unless resp_code == code
end

When /^I "(.*?)" "(.*?)" to "(.*?)"$/ do |method, content, update|
  @content = content
  req_uri  = "/#{$db_name}/_design/cinker/_update/#{update}"
  req_uri += "/#{@doc_id}" if method == 'put'
  req_uri += "?profile=#{URI.escape(@profile)}"
  req_uri += "&target_attr=#{URI.escape(@target_attr)}"
  req_uri += "&path=#{URI.escape(@path)}"
  # FIXME this is handled poorly
  if method == 'put'
    @resp = $couch.put(req_uri, content)
  else
    @resp = $couch.post(req_uri, content)
  end
end

Then /^I should get a valid response$/ do
  @presp = JSON.parse(@resp.body)
  raise 'code missing' unless @presp.include? 'code'
end

Then /^the response should have a "(.*?)" attribute$/ do |attr|
  raise "_id missing\n#{@presp}" unless @presp.include? attr
  @doc_id = @presp['doc_id'] if attr == 'doc_id'
end

Then /^the response should have the same doc_id$/ do
  raise "wrong id (#{@presp['doc_id']})" if @presp['doc_id'] != @doc_id
end

Then /^the doc_id should correspond to a doc$/ do
  resp = $couch.get("/#{$db_name}/#{@doc_id}")
  raise 'doc not found' if resp.code.to_i == 404
  @doc = JSON.parse(resp.body)
end

Then /^the doc should have a valid cinker cfg$/ do
  raise 'cinker not found' unless @doc.include? 'cinker'
  raise 'cfg not found' unless @doc['cinker'].include? 'cfg'
  raise 'profile cfg not found' unless @doc['cinker']['cfg'].include? @profile
  raise 'path cfg not found' unless @doc['cinker']['cfg'][@profile].include? @path
  raise 'logs not found' unless @doc['cinker'].include? 'logs'
  raise 'profile logs not found' unless @doc['cinker']['logs'].include? @profile
  unless @doc['cinker']['logs'][@profile].include? @path
    raise 'path logs not found' 
  end
end

Then /^the doc should contain the content$/ do
  raise 'test data missing' unless @doc[@target_attr] == @content
end
