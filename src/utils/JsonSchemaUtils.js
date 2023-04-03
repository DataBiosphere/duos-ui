import {
  get, set, isNil
} from 'lodash';


/**
 * Validates given object according to the schema in a format that
 * our internal form components can understand.
 *
 * @param {*} compiledSchema Compiled schema
 * @param {*} obj Form data
 * @returns Form component compatible validation object
 */
export const validateForm = (validate, obj) => {
  const valid = validate(obj);

  if (valid) {
    return [true, {}];
  }

  const validationObject = {};
  validate.errors.forEach((error) => {

    let path;
    let errorType;
    if (error.keyword === 'required') {
      path = error.instancePath +'/'+ error.params.missingProperty;
      errorType = 'required';
    } else if (error.keyword === 'format'){
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