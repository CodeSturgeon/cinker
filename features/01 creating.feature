Feature: Creating new cinks

  So I can cink files later
  As an admin

  Background:
    Given a profile of "cuketest"
    And a path of "/cuke/test"
    And a target_attr of "cuke_test"

  Scenario: Making a cink to a new doc
    When I "post" "cooktest" to cink_cfg
    Then I should get a valid response
    And the response should have a "doc_id" attribute
    And the doc_id should correspond to a doc
    And the doc should have a valid cinker cfg
    And the doc should contain the content

  Scenario: Making a cink to a new named doc
    Given a doc_id of "cuke_test"
    When I "put" "jimjam" to cink_cfg
    Then I should get a valid response
    And the response should have a "doc_id" attribute
    And the response should have the same doc_id
    And the doc_id should correspond to a doc
    And the doc should have a valid cinker cfg
    And the doc should contain the content

  Scenario: Making a cink to a new new doc with inital content

  Scenario: Making a cink from an existing property

  Scenario: Making a local doc from an exsisting cink
