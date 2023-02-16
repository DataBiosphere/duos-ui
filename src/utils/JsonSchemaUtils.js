import Ajv from 'ajv';
import {
  urlValidator,
  dateValidator,
  emailValidator
} from '../components/forms/formValidation';
import {
  get, set, isNil
} from 'lodash'

// const ajv = new Ajv({ allErrors: true, strict: false  });
// addFormats(ajv); // adds, e.g., date, uri, etc.

// const compileSchema = (schema) => {
//   return ajv.compile(schema);
// };

// const ajvErrorToFormValidationError = (ajvError) => {

// }

const formats = {
  date: dateValidator.isValid,
  uri: urlValidator.isValid,
  email: emailValidator.isValid
}

export const addFormats = (ajv) => {
  for (const formatId of Object.keys(formats)) {
    ajv = ajv.addFormat(formatId, formats[formatId]);
  }
  return ajv;
}

const updateValidation = (existingValidation, validationError) => {
  if (isNil(existingValidation)) {
    return {
      valid: false,
      failed: [validationError]
    }
  }

  // if the field is required and empty, we shouldn't also error on, e.g., that it isn't a date format
  if (existingValidation.failed.includes('required') || validationError === 'required') {
    return {
      valid: false,
      failed: ['required']
    }
  }

  return {
    valid: false,
    failed: existingValidation.failed + [validationError],
  }

  
}

const splitJsonPointer = (jsonPointer) => {

  if (jsonPointer[0] === '/') {
    jsonPointer = jsonPointer.substring(1, jsonPointer.length);
  }

  return jsonPointer.split('/');
}

export const validate = (compiledSchema, obj) => {
  const valid = compiledSchema(obj);

  if (valid) {
    return [true, {}];
  }

  const validationObject = {};
  compiledSchema.errors.forEach((error) => {

    let path;
    let errorType;
    if (error.keyword === 'required') {
      path = error.instancePath +'/'+ error.params.missingProperty;
      errorType = 'required';
    } else if (error.keyword === 'format'){
      // format errors are, e.g., date/email/uri errors
      path = error.instancePath;
      errorType = error.params.format;
    } else {
      return;
    }

    const splitPath = splitJsonPointer(path);

    // update the validation object for the current field with this new
    // error
    const existingValidation = get(validationObject, splitPath);
    const newValidation = updateValidation(existingValidation, errorType);
    set(validationObject, splitPath, newValidation);
  });

  return [false, validationObject];
}