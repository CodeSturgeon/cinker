require 'json'
require 'net/http'
require 'uri'

test_doc = "this is some test text"
http = Net::HTTP.new('localhost', 5984)
db_uri = '/play/'
cfg_uri = "#{db_uri}_design/cinker/_update/cink_cfg"
profile = 'cucumber'
target_attr = 'cucumber'
path = '/cuke/test'

Given /^a db connection$/ do
  thing = 'boing'
end

When /^I post test_doc to cink_cfg$/ do
  req_uri  = "#{cfg_uri}?profile=#{URI.escape(profile)}"
  req_uri += "&target_attr=#{URI.escape(target_attr)}"
  req_uri += "&path=#{URI.escape(path)}"
  @resp = http.post(req_uri, test_doc)
end

Then /^I should get a JSON response$/ do
  #raise 'not a good response' if @resp.code.to_i % 200 > 99
  @presp = JSON.parse(@resp.body)
end

Then /^the response should have a "(.*?)" attribute$/ do |attr|
  raise "_id missing\n#{@presp}" unless @presp.include? attr
end

Then /^the _id should correspond to a doc$/ do
  pending # express the regexp above with the code you wish you had
end

Then /^the doc should have a valid cinker cfg$/ do
  pending # express the regexp above with the code you wish you had
end

Then /^the doc should contain the contents of test_doc$/ do
  pending # express the regexp above with the code you wish you had
end

When /^I put test_doc to cink_up \/ doc_id$/ do
  pending # express the regexp above with the code you wish you had
end

Then /^the _id should equal doc_id$/ do
  pending # express the regexp above with the code you wish you had
end
