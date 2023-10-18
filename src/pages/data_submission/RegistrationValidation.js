import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {dateValidator, emailValidator, urlValidator} from '../../components/forms/formValidation';
import {get, isNil, set} from 'lodash';

/**
 * Generate a ValidateFunction from a dataset registration schema
 * @param schema
 * @returns ValidateFunction
 */
export const compileSchema = (schema) => {
  const ajv = new Ajv({strict: false, allErrors: true});
  addFormats(ajv);
  ajv.addKeyword('label')
    .addKeyword('prompt')
    .addFormat('date', dateValidator.isValid)
    .addFormat('uri', urlValidator.isValid)
    .addFormat('email', emailValidator.isValid);

  // Ajv doesn't like the `$schema` and `version` properties so we destructure them away
  // eslint-disable-next-line no-unused-vars
  const {$schema, version, ...filteredSchema} = schema;
  return ajv.compile(filteredSchema);
};

/**
 * Validates given form data object according to the schema in a format that
 * our internal form components can understand.
 *
 * @param {*} schema The dataset registration schema
 * @param {*} formData Form data instance of registration schema
 * @returns Form component compatible validation object
 */
export const validateForm = (schema, formData) => {
  const validateFunction = compileSchema(schema);
  const valid = validateFunction(formData);
  const validation = errorsToValidation(validateFunction.errors);
  return [valid, validation];
};

/**
 * Construct a validation object of the form:
 * {
 *  <fieldName>: { failed: ['required'], valid: true|false},
 *  <fieldName>: { failed: ['required'], valid: true|false},
 * }
 *
 * @param errors Schema validation errors from Ajv
 * @returns {{}}
 */
function errorsToValidation(errors) {
  let validation = {};
  if (errors !== null) {
    errors.forEach(error => {
      let path;
      let errorType;
      if (error.keyword === 'required') {
        path = error.instancePath + '/' + error.params.missingProperty;
        errorType = 'required';
      } else if (error.keyword === 'format') {
        // format errors are, e.g., date/email/uri errors
        path = error.instancePath;
        errorType = error.params.format; // e.g., 'date'
      } else if (error.keyword === 'type') {
        path = error.instancePath;
        errorType = error.params.type; // e.g., 'integer'
      } else {
        path = error.instancePath;
        errorType = 'unknown';
      }
      const splitPath = splitJsonPointer(path);
      // update the validation object for the current field with this new error
      const existingValidation = get(validation, splitPath);
      const newValidation = updateValidation(existingValidation, errorType);
      set(validation, splitPath, newValidation);
    });
  }
  return validation;
}

const updateValidation = (existingValidation, validationError) => {
  if (isNil(existingValidation)) {
    return {
      valid: false,
      failed: [validationError]
    };
  }
  // if the field is required and empty, we shouldn't also error on, e.g., that it isn't a date format
  if ((existingValidation.failed && existingValidation.failed.includes('required')) || validationError === 'required') {
    return {
      valid: false,
      failed: ['required']
    };
  }
  return {
    valid: false,
    failed: existingValidation.failed + [validationError],
  };
};

const splitJsonPointer = (jsonPointer) => {
  if (jsonPointer[0] === '/') {
    jsonPointer = jsonPointer.substring(1, jsonPointer.length);
  }
  return jsonPointer.split('/');
};
