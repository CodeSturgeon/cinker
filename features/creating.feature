Feature: Creating new cinks

So I can cink files later
As an admin

Scenario: Making a cink to a new new doc
  Given a db connection
  When I post test_doc to the cink_up
  Then I should get a JSON response
  And the response should have a '_id' attribute
  And the _id should correspond to a doc
  And the doc should have a valid cinker cfg
  And the doc should contain the contents of test_doc

Scenario: Making a cink to a named new doc
  Given a db connection
  When I put test_doc to cink_up / doc_id
  Then I should get a JSON response
  And the response should have a '_id' attribute
  And the _id should equal doc_id
  And the _id should correspond to a doc
  And the doc should have a valid cinker cfg
  And the doc should contain the contents of test_doc

