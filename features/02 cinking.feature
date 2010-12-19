Feature: Cinking local documents with couchdb properties

  Background:
    Given there is a document called "cuke_test"
    And a profile of "cuketest"
    And a path of "/cuke/test"
    And a target_attr of "cuke_test"

  Scenario: Cinking a local update when the doc has been altered
    Given a doc_id of "cuke_test"
    When I "put" "powpow" to cink_cfg
    Then I should get a valid response
    And the response should have a "doc_id" attribute
    And the response should have the same doc_id
    And the doc_id should correspond to a doc
    And the doc should have a valid cinker cfg
    And the doc should contain the content

  Scenario: Cinking a local update when the doc has not been altered
    Given a doc_id of "cuke_test"
    When I "put" "powpow" to cink_cfg
    Then I should get a valid response
    And the response code should be "304"
