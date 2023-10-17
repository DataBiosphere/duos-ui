import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Generate a ValidateFunction from a dataset registration schema
 * @param schema
 * @returns ValidateFunction
 */
export const compileSchema = (schema) => {
  const ajv = new Ajv({strict: false, allErrors: true});
  ajv.addKeyword('label');
  ajv.addKeyword('prompt');
  addFormats(ajv);
  const clone = Object.assign({}, schema);
  delete clone['$schema'];
  delete clone['version'];
  return ajv.compile(clone);
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

// Construct an object of the form: validation.`fieldName` { failed: ['required', 'unique', '.etc'], valid: true|false}
function errorsToValidation(errors) {
  let validation = {};
  if (errors !== null) {
    errors.forEach(err => {
      let field = err.params.missingProperty;
      if (field !== null) {
        Object.assign(validation, { [field]: { failed: [err.keyword], valid: false }});
      }
    });
  }
  return validation;
}
