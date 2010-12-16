Feature: Creating new cinks

  So I can cink files later
  As an admin

  Scenario: Making a cink to a new new doc
    Given a db connection
    When I post test_doc to cink_cfg
    Then I should get a JSON response
    And the response should have a "doc_id" attribute
    And the doc_id should correspond to a doc
    And the doc should have a valid cinker cfg
    And the doc should contain the contents of test_doc

  Scenario: Making a cink to a named new doc

  Scenario: Making a cink to a new new doc with inital content

  Scenario: Making a cink from an existing property

  Scenario: Making a local doc from an exsisting cink
