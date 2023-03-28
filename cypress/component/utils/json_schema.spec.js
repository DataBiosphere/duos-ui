/* eslint-disable no-undef */
import { compileSchema, validateForm } from '../../../src/utils/JsonSchemaUtils';

const jsonSchema = {
  '$id': 'https://example.com/person.schema.json',
  '$schema': 'https://json-schema.org/draft/2019-09/schema',
  'title': 'Person',
  'type': 'object',
  'required': [
    'firstName',
    'someArray'
  ],
  'properties': {
    'firstName': {
      'type': 'string',
      'description': "The person's first name."
    },
    'lastName': {
      'type': 'string',
      'description': "The person's last name."
    },
    'someDate': {
      'type': 'string',
      'format': 'date'
    },
    'aNumber': {
      'type': 'integer',
    },
    'someArray': {
      'type': 'array',
      'items': {
        '$ref': '#/$defs/someObject'
      }
    }
  },
  '$defs': {
    'someObject': {
      'type': 'object',
      'required': [
        'someUri',
      ],
      'properties': {
        'someUri': {
          'type': 'string',
          'format': 'uri'
        },
        'someEmail': {
          'type': 'string',
          'format': 'email'
        }
      }
    }
  }
};

describe('JsonSchema - validate form', () => {
  const compiledSchema = compileSchema(jsonSchema);

  it('validates good data ok', () => {
    let [valid, failures] = validateForm(compiledSchema, {
      firstName: 'John',
      lastName: 'Doe',
      someDate: '2022-10-10',
      aNumber: 20,
      someArray: [
        {
          someUri: 'asdf.com',
          someEmail: 'asdf@asdf.com'
        }
      ]
    });

    expect(valid).to.equal(true);
    expect(failures).to.be.empty;

    [valid, failures] = validateForm(compiledSchema, {
      firstName: 'Jonathan',
      lastName: 'Deer',
      someDate: '2010-12-08',
      someArray: [
        {
          someUri: 'https://google.com',
          someEmail: 'asdf.hjkl@duos.org'
        }
      ]
    });

    expect(valid).to.equal(true);
    expect(failures).to.be.empty;
  });

  it('handles multiple array elements', () => {
    const [valid, failures] = validateForm(compiledSchema, {
      firstName: 'Jonathan',
      lastName: 'Deer',
      someDate: '2010-12-08',
      someArray: [
        {
          someUri: 'https://google.com',
          someEmail: 'asdf.hjkl@duos.org'
        },
        {
          someUri: 'https://bing.com',
          someEmail: 'qwer.uiop@duos.org'
        },
        {
          someEmail: 'zxcv.vbnm@duos.org'
        }
      ]
    });

    expect(valid).to.equal(false);
    expect(failures).to.deep.equal({
      'someArray': [
        undefined,
        undefined,
        {
          'someUri': {
            'valid': false,
            'failed': [
              'required'
            ]
          }
        }
      ]
    });
  });

  it('handles custom formats', () => {
    let [valid, failures] = validateForm(compiledSchema, {
      firstName: 'John',
      lastName: 'Doe',
      someDate: 'invalid-10-10',
      someArray: [
        {
          someUri: 'NOT A URL',
          someEmail: 'asdjfasdfhalsdkfj'
        },
        {
          someUri: 'asdf.com',
          someEmail: 'asdf@gmail.com'
        }
      ]
    });

    expect(valid).to.equal(false);
    expect(failures).to.deep.equal({
      'someDate': {
        'valid': false,
        'failed': [
          'date'
        ]
      },
      'someArray': [
        {
          'someEmail': {
            'valid': false,
            'failed': [
              'email'
            ]
          }
        }
      ]
    });
  });

  it('handles invalid type', () => {
    let [valid, failures] = validateForm(compiledSchema, {
      firstName: 'John',
      lastName: 20,
      someDate: '2022-10-10',
      aNumber: '10',
      someArray: [
        {
          someUri: 'asdf.com',
          someEmail: 'asdf@asdf.com'
        }
      ]
    });

    expect(valid).to.equal(false);
    expect(failures).to.deep.equal({
      'lastName': {
        'valid': false,
        'failed': [
          'string'
        ]
      },
      'aNumber': {
        'valid': false,
        'failed': [
          'integer'
        ]
      }
    });
  });

});
