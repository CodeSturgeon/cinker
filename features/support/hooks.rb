# Scratch and rebuild the test database

# Request db
db_uri = "/#{$db_name}"
resp = $couch.get(db_uri)
if resp.code.to_i == 200
  # Delete if found
  resp = $couch.delete(db_uri)
  raise "strage db delete response: #{resp}" unless resp.code.to_i == 200
elsif resp.code.to_i != 404
  raise "freaky db query response: #{resp}"
end

# Create DB
resp = $couch.put(db_uri,'')
raise "strange db create response: #{resp}" unless resp.code.to_i == 201

# push ddoc
ret = %x{couchapp push ddoc #{$db_name} 2>&1}
raise "ddoc push to couchdb failed!\n#{ret}\n" unless $?.exitstatus == 0
