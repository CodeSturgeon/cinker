require 'net/http'

$couch = Net::HTTP.new('localhost', 5984)
$db_name = 'cinker_test'
