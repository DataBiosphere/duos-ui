import {default as Ajv} from 'ajv/dist/2019';
import {dateValidator, emailValidator, uniqueValidator, urlValidator} from '../components/forms/formValidation';
import {get, isNil, set} from 'lodash';

const formats = {
  date: dateValidator.isValid,
  uri: urlValidator.isValid,
  email: emailValidator.isValid,
  unique: uniqueValidator.isValid
};

/**
 * Validates given object according to the schema in a format that
 * our internal form components can understand.
 *
 * @param {*} validate Compiled schema
 * @param {*} obj Form data
 * @param {*} studyNames List of existing study names
 * @returns Form component compatible validation object
 */
export const validateForm = (validate, obj, studyNames = []) => {

  const studyNameUnique = !studyNames.includes(obj.studyName);
  const valid = validate(obj) && studyNameUnique;

  if (valid) {
    return [true, {}];
  }

  const validationObject = {};
  validate.errors.forEach((error) => {

    let path;
    let errorType;
    if (error.keyword === 'unique') {
      path = error.instancePath + '/' + error.params.missingProperty;
      errorType = 'unique';
    } else if (error.keyword === 'required') {
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

    // update the validation object for the current field with this new
    // error
    const existingValidation = get(validationObject, splitPath);
    const newValidation = updateValidation(existingValidation, errorType);
    set(validationObject, splitPath, newValidation);
  });

  if (!studyNameUnique) {
    validationObject.studyName = {
      failed: ['unique'],
      valid: false
    };
  }

  return [false, validationObject];
};

const updateValidation = (existingValidation, validationError) => {
  if (isNil(existingValidation)) {
    return {
      valid: false,
      failed: [validationError]
    };
  }

  // if the field is required and empty, we shouldn't also error on, e.g., that it isn't a date format
  if (existingValidation.failed.includes('required') || validationError === 'required') {
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

/**
 * Compiles schema (defaults to 2019-09 draft version of JSON Schema)
 */
export const compileSchema = (schema) => {
  return addFormats(new Ajv({strict: false, allErrors: true})).compile(schema);
};


const addFormats = (ajv) => {
  for (const formatId of Object.keys(formats)) {
    ajv = ajv.addFormat(formatId, formats[formatId]);
  }
  return ajv;
};