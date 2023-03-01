/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from 'cypress/react18';
import DarCollectionReview from '../../../src/pages/dar_collection_review/DarCollectionReview';
import { Collections, User, Match } from '../../../src/libs/ajax';
import { Storage } from '../../../src/libs/storage';
import { Navigation } from '../../../src/libs/utils';
import { OntologyService } from '../../../src/libs/ontologyService';


const dar = {
  'darCollectionId': 777,
  'darCode': 'DAR-XXX',
  'createDate': 1669229413840,
  'createUser': {
    'userId': 7,
    'dacUserId': 7,
    'email': 'Bob.Jones@prodigy.com',
    'displayName': 'Bob Jones',
    'createDate': 1668229413840,
    'roles': null,
    'properties': [
      {
        'propertyId': 19000,
        'userId': 7,
        'propertyKey': 'suggestedInstitution',
        'propertyValue': ''
      },
      {
        'propertyId': 18999,
        'userId': 7,
        'propertyKey': 'suggestedSigningOfficial',
        'propertyValue': ''
      },
      {
        'propertyId': 18998,
        'userId': 7,
        'propertyKey': 'selectedSigningOfficialId',
        'propertyValue': '5555'
      },
      {
        'propertyId': 18995,
        'userId': 7,
        'propertyKey': 'eraExpiration',
        'propertyValue': '1670117014385'
      },
      {
        'propertyId': 18994,
        'userId': 7,
        'propertyKey': 'eraAuthorized',
        'propertyValue': 'true'
      },
      {
        'propertyId': 17158,
        'userId': 7,
        'propertyKey': 'scientificURL',
        'propertyValue': ''
      },
      {
        'propertyId': 17157,
        'userId': 7,
        'propertyKey': 'isThePI',
        'propertyValue': 'true'
      },
      {
        'propertyId': 17156,
        'userId': 7,
        'propertyKey': 'department',
        'propertyValue': 'TPS'
      },
      {
        'propertyId': 17155,
        'userId': 7,
        'propertyKey': 'checkNotifications',
        'propertyValue': 'true'
      },
      {
        'propertyId': 17154,
        'userId': 7,
        'propertyKey': 'state',
        'propertyValue': 'CA'
      },
      {
        'propertyId': 17153,
        'userId': 7,
        'propertyKey': 'researcherGate',
        'propertyValue': ''
      },
      {
        'propertyId': 17152,
        'userId': 7,
        'propertyKey': 'piERACommonsID',
        'propertyValue': ''
      },
      {
        'propertyId': 17151,
        'userId': 7,
        'propertyKey': 'academicEmail',
        'propertyValue': 'Bob.Jones@prodigy.com'
      },
      {
        'propertyId': 17150,
        'userId': 7,
        'propertyKey': 'zipcode',
        'propertyValue': '90210'
      },
      {
        'propertyId': 17149,
        'userId': 7,
        'propertyKey': 'division',
        'propertyValue': ''
      },
      {
        'propertyId': 17867,
        'userId': 7,
        'propertyKey': 'piName',
        'propertyValue': 'Bob Jones'
      },
      {
        'propertyId': 17147,
        'userId': 7,
        'propertyKey': 'pubmedID',
        'propertyValue': ''
      },
      {
        'propertyId': 17146,
        'userId': 7,
        'propertyKey': 'linkedIn',
        'propertyValue': ''
      },
      {
        'propertyId': 17145,
        'userId': 7,
        'propertyKey': 'completed',
        'propertyValue': 'true'
      },
      {
        'propertyId': 17144,
        'userId': 7,
        'propertyKey': 'orcid',
        'propertyValue': ''
      },
      {
        'propertyId': 17143,
        'userId': 7,
        'propertyKey': 'havePI',
        'propertyValue': ''
      },
      {
        'propertyId': 17142,
        'userId': 7,
        'propertyKey': 'address1',
        'propertyValue': '1313 Mockingbird Lane'
      },
      {
        'propertyId': 17141,
        'userId': 7,
        'propertyKey': 'piEmail',
        'propertyValue': 'Bob.Jones@prodigy.com'
      },
      {
        'propertyId': 17140,
        'userId': 7,
        'propertyKey': 'city',
        'propertyValue': 'Mockingbird Heights'
      },
      {
        'propertyId': 17139,
        'userId': 7,
        'propertyKey': 'address2',
        'propertyValue': ''
      },
      {
        'propertyId': 17138,
        'userId': 7,
        'propertyKey': 'country',
        'propertyValue': 'USA'
      }
    ],
    'emailPreference': true,
    'institutionId': 90210,
    'eraCommonsId': 'HERMAN',
    'institution': {
      'id': 90210,
      'name': 'Ace Industries',
      'itDirectorName': null,
      'itDirectorEmail': null,
      'signingOfficials': null,
      'institutionUrl': null,
      'dunsNumber': null,
      'orgChartUrl': null,
      'verificationUrl': null,
      'verificationFilename': null,
      'organizationType': null,
      'createDate': 1626700443000,
      'createUserId': null,
      'updateDate': null,
      'updateUserId': null,
      'createUser': null,
      'updateUser': null
    },
    'libraryCards': [
      {
        'id': 182,
        'userId': 7,
        'institutionId': 90210,
        'eraCommonsId': null,
        'userName': 'Bob Jones',
        'userEmail': 'Bob.Jones@prodigy.com',
        'createDate': 1667817915000,
        'createUserId': 5555,
        'updateDate': null,
        'updateUserId': null,
        'institution': null
      }
    ]
  },
  'createUserId': 7,
  'updateDate': null,
  'updateUserId': null,
  'dars': {
    'dars-id-123': {
      'id': 2147,
      'referenceId': 'dars-id-123',
      'collectionId': 777,
      'data': {
        'referenceId': 'dars-id-123',
        'institution': 'Ace Industries',
        'projectTitle': 'Collection of sleep apnea samples',
        'checkCollaborator': false,
        'checkNihDataOnly': false,
        'researcher': 'Bob Jones',
        'rus': 'One good RUS\n',
        'nonTechRus': 'One non-technical RUS\n',
        'diseases': true,
        'methods': true,
        'other': false,
        'ontologies': [
          {
            'id': 'http://purl.obolibrary.org/obo/DOID_8577',
            'label': 'sleep apnea',
            'definition': null,
            'synonyms': null
          }
        ],
        'forProfit': false,
        'oneGender': false,
        'pediatric': false,
        'illegalBehavior': false,
        'addiction': false,
        'sexualDiseases': false,
        'stigmatizedDiseases': false,
        'vulnerablePopulation': false,
        'populationMigration': false,
        'psychiatricTraits': false,
        'notHealth': false,
        'hmb': false,
        'poa': false,
        'datasets': [
          {
            'key': '867',
            'value': '867',
            'label': 'Sleep Apnea'
          }
        ],
        'darCode': 'DAR-XXX',
        'createDate': 1667971415440,
        'sortDate': 1667971415440,
        'datasetIds': [
          13
        ],
        'datasetDetail': [],
        'anvilUse': false,
        'localUse': true,
        'itDirector': 'Jared Dunn',
        'signingOfficial': 'Alice Smith (Alice.Smith@prodigy.com)',
        'labCollaborators': [],
        'internalCollaborators': [
          {
            'approverStatus': null,
            'email': 'homer.simpson@aol.com',
            'eraCommonsId': 'HOMER-SIMPSON-4',
            'name': 'Homer Simpson',
            'title': 'Researcher',
            'uuid': 'researcher-2'
          }
        ],
        'externalCollaborators': [],
        'pubAcknowledgement': false,
        'dsacknowledgement': false,
        'gsoacknowledgement': false
      },
      'draft': false,
      'userId': 7,
      'createDate': 1667970929000,
      'sortDate': 1669229413840,
      'submissionDate': 1669229413840,
      'updateDate': 1669229413840,
      'elections': {
        '8888': {
          'electionId': 8888,
          'electionType': 'DataAccess',
          'status': 'Open',
          'createDate': 1669062648000,
          'referenceId': 'dars-id-123',
          'dataSetId': 13,
          'votes': {
            '8675': {
              'voteId': 8675,
              'vote': true,
              'dacUserId': 4444,
              'createDate': 1669062648000,
              'updateDate': 1669120753000,
              'electionId': 8888,
              'rationale': '',
              'type': 'DAC',
              'displayName': 'Beth Johnson'
            },
            '8676': {
              'voteId': 8676,
              'dacUserId': 11111,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'DAC',
              'displayName': 'Ted Lasso'
            },
            '8677': {
              'voteId': 8677,
              'dacUserId': 11111,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'Chairperson',
              'displayName': 'Ted Lasso'
            },
            '8678': {
              'voteId': 8678,
              'dacUserId': 11111,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'FINAL',
              'displayName': 'Ted Lasso'
            },
            '8679': {
              'voteId': 8679,
              'dacUserId': 11111,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'AGREEMENT',
              'displayName': 'Ted Lasso'
            },
            '8680': {
              'voteId': 8680,
              'dacUserId': 9988,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'DAC',
              'displayName': 'Stuart Williams'
            },
            '8681': {
              'voteId': 8681,
              'dacUserId': 9988,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'Chairperson',
              'displayName': 'Stuart Williams'
            },
            '8682': {
              'voteId': 8682,
              'dacUserId': 9988,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'FINAL',
              'displayName': 'Stuart Williams'
            },
            '8683': {
              'voteId': 8683,
              'dacUserId': 9988,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'AGREEMENT',
              'displayName': 'Stuart Williams'
            },
            '8684': {
              'voteId': 8684,
              'dacUserId': 4585,
              'createDate': 1669062648000,
              'electionId': 8888,
              'type': 'DAC',
              'displayName': 'Sue Smtih'
            }
          }
        },
        '1776': {
          'electionId': 1776,
          'electionType': 'RP',
          'status': 'Open',
          'createDate': 1669062648000,
          'referenceId': 'dars-id-123',
          'dataSetId': 13,
          'votes': {
            '8688': {
              'voteId': 8688,
              'dacUserId': 9988,
              'createDate': 1669062648000,
              'electionId': 1776,
              'type': 'DAC',
              'displayName': 'Stuart Williams'
            },
            '8689': {
              'voteId': 8689,
              'dacUserId': 9988,
              'createDate': 1669062648000,
              'electionId': 1776,
              'type': 'Chairperson',
              'displayName': 'Stuart Williams'
            },
            '8690': {
              'voteId': 8690,
              'dacUserId': 4585,
              'createDate': 1669062648000,
              'electionId': 1776,
              'type': 'DAC',
              'displayName': 'Sue Smtih'
            },
            '8685': {
              'voteId': 8685,
              'dacUserId': 4444,
              'createDate': 1669062648000,
              'electionId': 1776,
              'type': 'DAC',
              'displayName': 'Beth Johnson'
            },
            '8686': {
              'voteId': 8686,
              'dacUserId': 11111,
              'createDate': 1669062648000,
              'electionId': 1776,
              'type': 'DAC',
              'displayName': 'Ted Lasso'
            },
            '8687': {
              'voteId': 8687,
              'dacUserId': 11111,
              'createDate': 1669062648000,
              'electionId': 1776,
              'type': 'Chairperson',
              'displayName': 'Ted Lasso'
            }
          }
        }
      },
      'datasetIds': [
        13
      ]
    }
  },
  'datasets': [
    {
      'dataSetId': 13,
      'objectId': null,
      'name': 'Sleep Apnea',
      'datasetName': 'Sleep Apnea',
      'createDate': 1567123200000,
      'createUserId': null,
      'updateDate': 1643730658770,
      'updateUserId': 11111,
      'active': true,
      'consentName': null,
      'needsApproval': null,
      'alias': 999,
      'datasetIdentifier': 'DUOS-00999',
      'dataUse': {
        'diseaseRestrictions': [
          'http://purl.obolibrary.org/obo/DOID_0050847'
        ],
        'populationOriginsAncestry': true,
        'controlSetOption': 'Yes'
      },
      'dacId': 1,
      'consentId': 'B177D3C2-CDD8-4153-9CBF-AE4F0C34609A',
      'translatedUseRestriction': 'Samples are restricted for use under the following conditions:\nData use is limited for studying: sleep apnea [DS]\nFuture use for population origins or ancestry research is prohibited. [POA]\nCommercial use is not prohibited.\nData use for methods development research irrespective of the specified data use limitations is not prohibited.\nFuture use as a control set for diseases other than those specified is prohibited. [NCTRL]',
      'deletable': false,
      'sharingPlanDocument': null,
      'sharingPlanDocumentName': null,
      'properties': [
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': '# of participants',
          'propertyValue': 17,
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'Number',
          'propertyTypeAsString': 'number',
          'propertyValueAsString': '17'
        },
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': 'Dataset Name',
          'propertyValue': 'Sleep Apnea',
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'String',
          'propertyTypeAsString': 'string',
          'propertyValueAsString': 'Sleep Apnea'
        },
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': 'Description',
          'propertyValue': 'Single cell RNA-sequence',
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'String',
          'propertyTypeAsString': 'string',
          'propertyValueAsString': 'Single cell RNA-sequence'
        },
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': 'Data Type',
          'propertyValue': 'RNA-seq',
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'String',
          'propertyTypeAsString': 'string',
          'propertyValueAsString': 'RNA-seq'
        },
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': 'Data Depositor',
          'propertyValue': 'data_depositor@example.com',
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'String',
          'propertyTypeAsString': 'string',
          'propertyValueAsString': 'data_depositor@example.com'
        },
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': 'Principal Investigator(PI)',
          'propertyValue': 'Lisa Simpson, Betty White',
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'String',
          'propertyTypeAsString': 'string',
          'propertyValueAsString': 'Lisa Simpson, Betty White'
        },
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': 'Species',
          'propertyValue': 'Human',
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'String',
          'propertyTypeAsString': 'string',
          'propertyValueAsString': 'Human'
        },
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': 'Phenotype/Indication',
          'propertyValue': 'sleep apnea',
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'String',
          'propertyTypeAsString': 'string',
          'propertyValueAsString': 'sleep apnea'
        },
        {
          'propertyId': null,
          'dataSetId': 13,
          'propertyKey': null,
          'propertyName': 'dbGAP',
          'propertyValue': 'https://...',
          'createDate': null,
          'schemaProperty': null,
          'propertyType': 'String',
          'propertyTypeAsString': 'string',
          'propertyValueAsString': 'https://...'
        }
      ],
      'dacApproval': true
    }
  ]
};

const props = {
  'history': {
    'length': 50,
    'action': 'PUSH',
    'location': {
      'pathname': '/admin_review_collection/777',
      'search': '',
      'hash': '',
      'key': 'z0i073'
    }
  },
  'location': {
    'pathname': '/admin_review_collection/777',
    'search': '',
    'hash': '',
    'key': 'z0i073'
  },
  'match': {
    'path': '/admin_review_collection/:collectionId',
    'url': '/admin_review_collection/777',
    'isExact': true,
    'params': {
      'collectionId': '777'
    }
  },
  'adminPage': false,
  'isLogged': true,
  'env': 'local'
};

const user = {
  userId: 11111,
  roles: [
    {
      dacId: 11111,
      userRoleId: 586,
      userId: 1,
      roleId: 2,
      name: 'Chairperson'
    }
  ]
};

const researcher = {
  'userId': 7,
  'dacUserId': 7,
  'email': 'Bob.Jones@prodigy.com',
  'displayName': 'Bob Jones',
  'createDate': 1668229413840,
  'roles': null
};

const ontologyResponse = [
];

const matchResponse = [
  {
    'id': 911,
    'consent': 'DUOS-00099',
    'purpose': 'dars-id-123',
    'match': true,
    'failed': false,
    'createDate': 1668729600000,
    'algorithmVersion': 'v2',
    'failureReasons': []
  }
];

const dacDatasets = [{
  'datasetName': null,
  'dacId': 3,
  'dataSetId': 13,
  'consentId': 'B177D3C2-CDD8-4153-9CBF-AE4F0C34609A',
  'translatedUseRestriction': '',
  'deletable': null,
  'properties': [
    {
      'propertyName': 'Dataset Name',
      'propertyValue': 'Sleep Apnea'
    }
  ],
  'active': true,
  'needsApproval': true,
  'isAssociatedToDataOwners': null,
  'updateAssociationToDataOwnerAllowed': null,
  'alias': 999,
  'datasetIdentifier': 'DUOS-000999',
  'objectId': null,
  'createDate': 1648512000000,
  'createUserId': 5052,
  'updateDate': 1648590021870,
  'updateUserId': 5052,
  'dataUse': {
    'generalUse': true
  }
}];

beforeEach(() => {
  cy.stub(Collections, 'getCollectionById').returns(dar);
  cy.stub(Storage, 'getCurrentUser').returns(user);
  cy.stub(User, 'getById').returns(researcher);
  cy.stub(Navigation, 'console').returns({});
  cy.stub(OntologyService, 'searchOntology').returns(ontologyResponse);
  cy.stub(Match, 'findMatchBatch').returns(matchResponse);
  cy.stub(User, 'getUserRelevantDatasets').returns(dacDatasets);
});

describe('DAR Review', () => {
  it('renders the collections-review-page div', () => {
    mount(<DarCollectionReview {...props}/>);
    const chairContainer = cy.get('.collection-review-page').find('.tab-selection-Chair');
    const memberContainer = cy.get('.collection-review-page').find('.tab-selection-Member');
    chairContainer.should('exist').should('be.visible');
    memberContainer.should('exist').should('be.visible');
    cy.get('.dataset-list-item').should('not.exist');
    chairContainer.click().then(()=>{
      cy.get('.dataset-list-item').should('exist').should('be.visible').contains('Sleep Apnea');
    });
    memberContainer.click().then(()=>{
      cy.get('.dataset-list-item').should('exist').should('be.visible').contains('Sleep Apnea');
    });
  });
});