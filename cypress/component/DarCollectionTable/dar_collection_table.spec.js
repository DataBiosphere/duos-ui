/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import { DarCollectionTableColumnOptions, DarCollectionTable } from '../../../src/components/dar_collection_table/DarCollectionTable';

const collections = [
  {
    "darCollectionId": 211,
    "darCode": "DAR-259",
    "createDate": 1597414913000,
    "createUser": {
      "dacUserId": 3359,
      "email": "gregory.rushton@gmail.com",
      "displayName": "Gregory Rushton Researcher",
      "createDate": 1454600238000,
      "additionalEmail": "grushton@broadinstitute.org",
      "roles": null,
      "properties": null,
      "emailPreference": false,
      "profileCompleted": null,
      "institutionId": 231,
      "eraCommonsId": "grushton",
      "institution": {
        "id": 231,
        "name": "Broad Institute",
        "itDirectorName": null,
        "itDirectorEmail": null,
        "signingOfficials": null,
        "createDate": 1620128681000,
        "createUserId": null,
        "updateDate": 1620133349000,
        "updateUserId": null,
        "createUser": null,
        "updateUser": null
      },
      "libraryCards": null
    },
    "createUserId": 3359,
    "updateDate": null,
    "updateUserId": null,
    "dars": {
      "41031cb4-bc24-4c10-b7f6-ef97ad50184b": {
        "id": 337,
        "referenceId": "41031cb4-bc24-4c10-b7f6-ef97ad50184b",
        "collectionId": 211,
        "data": {
          "referenceId": "41031cb4-bc24-4c10-b7f6-ef97ad50184b",
          "investigator": "Gregory Rushton",
          "institution": "Broad",
          "department": "DSP",
          "address1": "75 Ames St",
          "city": "Cambridge",
          "zipCode": "02356",
          "state": "Massachusetts",
          "country": "US",
          "projectTitle": "Validation Test",
          "checkCollaborator": false,
          "researcher": "Gregory Rushton",
          "isThePi": "true",
          "academicEmail": "gregory.rushton@gmail.com",
          "orcid": "https://orcid.org/0000-0002-4648-4229",
          "rus": "Validation Test",
          "nonTechRus": "Validation Test",
          "diseases": false,
          "other": false,
          "ontologies": [],
          "forProfit": false,
          "oneGender": false,
          "pediatric": false,
          "illegalBehavior": false,
          "addiction": false,
          "sexualDiseases": false,
          "stigmatizedDiseases": false,
          "vulnerablePopulation": false,
          "populationMigration": false,
          "psychiatricTraits": false,
          "notHealth": false,
          "hmb": true,
          "poa": false,
          "datasets": [
            {
              "key": "369",
              "value": "369",
              "label": "TOPMed CCAF_GRU_IRB_phs001189.v1.p1.c1"
            },
            {
              "key": "385",
              "value": "385",
              "label": "TOPMed FHS_HMB_IRB_NPU_MDS_phs000007.v29.p10.c2"
            }
          ],
          "darCode": "DAR-259-A-1",
          "restriction": {
            "type": "and",
            "operands": [
              {
                "type": "and",
                "operands": [
                  {
                    "type": "not",
                    "operand": {
                      "name": "http://purl.obolibrary.org/obo/DUO_0000015",
                      "type": "named"
                    }
                  },
                  {
                    "type": "not",
                    "operand": {
                      "name": "http://purl.obolibrary.org/obo/DUO_0000011",
                      "type": "named"
                    }
                  },
                  {
                    "type": "not",
                    "operand": {
                      "name": "http://www.broadinstitute.org/ontologies/DUOS/control",
                      "type": "named"
                    }
                  }
                ]
              },
              {
                "name": "http://purl.obolibrary.org/obo/DUO_0000018",
                "type": "named"
              }
            ]
          },
          "validRestriction": true,
          "translatedUseRestriction": "Samples will be used under the following conditions:<br>Data will not be used for commercial purpose<br>",
          "createDate": 1597414913968,
          "sortDate": 1597425622464,
          "datasetIds": [
            385
          ],
          "datasetDetail": [],
          "labCollaborators": [],
          "internalCollaborators": [],
          "externalCollaborators": []
        },
        "draft": false,
        "userId": 3359,
        "createDate": 1597414913000,
        "sortDate": 1597425622000,
        "submissionDate": 1597425622000,
        "updateDate": 1597425622000,
        "elections": {}
      },
      "f2ddecf0-76ae-4a09-8ad5-fbbcc0233a09": {
        "id": 336,
        "referenceId": "f2ddecf0-76ae-4a09-8ad5-fbbcc0233a09",
        "collectionId": 211,
        "data": {
          "referenceId": "f2ddecf0-76ae-4a09-8ad5-fbbcc0233a09",
          "investigator": "Gregory Rushton",
          "institution": "Broad",
          "department": "DSP",
          "address1": "75 Ames St",
          "city": "Cambridge",
          "zipCode": "02356",
          "state": "Massachusetts",
          "country": "US",
          "projectTitle": "Validation Test",
          "checkCollaborator": false,
          "researcher": "Gregory Rushton",
          "isThePi": "true",
          "academicEmail": "gregory.rushton@gmail.com",
          "orcid": "https://orcid.org/0000-0002-4648-4229",
          "rus": "Validation Test",
          "nonTechRus": "Validation Test",
          "diseases": false,
          "other": false,
          "ontologies": [],
          "forProfit": false,
          "oneGender": false,
          "pediatric": false,
          "illegalBehavior": false,
          "addiction": false,
          "sexualDiseases": false,
          "stigmatizedDiseases": false,
          "vulnerablePopulation": false,
          "populationMigration": false,
          "psychiatricTraits": false,
          "notHealth": false,
          "hmb": true,
          "poa": false,
          "datasets": [
            {
              "key": "369",
              "value": "369",
              "label": "TOPMed CCAF_GRU_IRB_phs001189.v1.p1.c1"
            },
            {
              "key": "385",
              "value": "385",
              "label": "TOPMed FHS_HMB_IRB_NPU_MDS_phs000007.v29.p10.c2"
            }
          ],
          "darCode": "DAR-259-A-0",
          "restriction": {
            "type": "and",
            "operands": [
              {
                "type": "and",
                "operands": [
                  {
                    "type": "not",
                    "operand": {
                      "name": "http://purl.obolibrary.org/obo/DUO_0000015",
                      "type": "named"
                    }
                  },
                  {
                    "type": "not",
                    "operand": {
                      "name": "http://purl.obolibrary.org/obo/DUO_0000011",
                      "type": "named"
                    }
                  },
                  {
                    "type": "not",
                    "operand": {
                      "name": "http://www.broadinstitute.org/ontologies/DUOS/control",
                      "type": "named"
                    }
                  }
                ]
              },
              {
                "name": "http://purl.obolibrary.org/obo/DUO_0000018",
                "type": "named"
              }
            ]
          },
          "validRestriction": true,
          "translatedUseRestriction": "Samples will be used under the following conditions:<br>Data will not be used for commercial purpose<br>",
          "createDate": 1597414913968,
          "sortDate": 1597425622464,
          "datasetIds": [
            369
          ],
          "datasetDetail": [],
          "labCollaborators": [],
          "internalCollaborators": [],
          "externalCollaborators": []
        },
        "draft": false,
        "userId": 3359,
        "createDate": 1597414913000,
        "sortDate": 1597425622000,
        "submissionDate": 1597425622000,
        "updateDate": 1597425622000,
        "elections": {}
      }
    },
    "datasets": [
      {
        "dataSetId": 385,
        "name": "TOPMed FHS_HMB_IRB_NPU_MDS_phs000007.v29.p10.c2",
        "createDate": 1557878400000,
        "active": true,
        "alias": 28,
        "dataUse": {
          "hmbResearch": true,
          "populationOriginsAncestry": true,
          "commercialUse": false,
          "genomicPhenotypicData": "Yes",
          "other": "IRB Approval Required"
        },
        "datasetIdentifier": "DUOS-000028"
      },
      {
        "dataSetId": 369,
        "name": "TOPMed CCAF_GRU_IRB_phs001189.v1.p1.c1",
        "createDate": 1557878400000,
        "updateDate": 1614717409988,
        "updateUserId": 5018,
        "active": false,
        "alias": 12,
        "dataUse": {
          "generalUse": true,
          "genomicPhenotypicData": "Yes",
          "other": "IRB Approval Required"
        },
        "datasetIdentifier": "DUOS-000012"
      }
    ]
  }
];

describe('DataUseVoteSummary - Tests', function() {
  it('renders a row of elements summarizing the vote result for each bucket', function() {
    const columns = [
      DarCollectionTableColumnOptions.DAR_CODE
    ];
    mount(
      <DarCollectionTable
        collections={collections}
        columns={columns}
        isRendered={true}
        isLoading={false}
        cancelCollection={null}
        resubmitCollection={null}
        actionsDisabled={false}
      />
    );
    const colHeaders = cy.get('.column-header');
    colHeaders.should('have.length', 1);
  });

  it('renders a row of elements summarizing the vote result for each bucket', function() {
    const columns = [
      DarCollectionTableColumnOptions.DAR_CODE,
      DarCollectionTableColumnOptions.DATASET_COUNT
    ];
    mount(
      <DarCollectionTable
        collections={collections}
        columns={columns}
        isRendered={true}
        isLoading={false}
        cancelCollection={null}
        resubmitCollection={null}
        actionsDisabled={false}
      />
    );
    const colHeaders = cy.get('.column-header');
    colHeaders.should('have.length', 2);
  });

  it('should render skeleton table if isLoading is true', function() {
    mount(
      <DarCollectionTable
        isLoading={true}
      />
    );
    const component = cy.get('.table-data');
    component.should('exist');
    const rows = cy.get('.placeholder-row-1-container');
    rows.should('exist');
  });
});