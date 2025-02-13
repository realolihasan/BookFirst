// Path: backend/middleware/validationMiddleware.js

const { ValidationError } = require('./errorMiddleware');
const { MODEL_EXPERTISE, VALIDATION } = require('../config/constants');

const validatePortfolio = (req, res, next) => {
  console.log('--- Portfolio Validation Start ---');
  console.log('Raw request body:', req.body);

  // Destructure the expected fields from req.body
  let { modelName, expertise, height, weight, chest, waist } = req.body;

  // Trim modelName and expertise if they are strings
  if (typeof modelName === 'string') {
    modelName = modelName.trim();
    req.body.modelName = modelName;
  }
  if (typeof expertise === 'string') {
    expertise = expertise.trim();
    req.body.expertise = expertise;
  }

  console.log('Trimmed modelName:', modelName);
  console.log('Trimmed expertise:', expertise);

  // Validate modelName
  if (!modelName) {
    console.error('Validation error: Model name is required');
    throw new ValidationError('Model name is required');
  }

  // Validate expertise: it must be one of the allowed values
  if (!expertise || !Object.values(MODEL_EXPERTISE).includes(expertise)) {
    console.error('Validation error: Invalid expertise');
    throw new ValidationError('Invalid expertise');
  }

  // Ensure the numeric fields are provided and not empty
  const numericFields = { height, weight, chest, waist };
  for (const [key, value] of Object.entries(numericFields)) {
    if (value === undefined || value === null || value === '') {
      console.error(`Validation error: Field "${key}" is required and must be a number (received "${value}")`);
      throw new ValidationError(`Field "${key}" is required and must be a number`);
    }
  }

  // Define measurement constraints for each numeric field
  const measurements = {
    height: { value: height, min: VALIDATION.MODEL_MEASUREMENTS.HEIGHT_MIN, max: VALIDATION.MODEL_MEASUREMENTS.HEIGHT_MAX },
    weight: { value: weight, min: VALIDATION.MODEL_MEASUREMENTS.WEIGHT_MIN, max: VALIDATION.MODEL_MEASUREMENTS.WEIGHT_MAX },
    chest:  { value: chest,  min: VALIDATION.MODEL_MEASUREMENTS.CHEST_MIN,  max: VALIDATION.MODEL_MEASUREMENTS.CHEST_MAX },
    waist:  { value: waist,  min: VALIDATION.MODEL_MEASUREMENTS.WAIST_MIN,  max: VALIDATION.MODEL_MEASUREMENTS.WAIST_MAX }
  };

  // Validate each measurement field
  for (const [key, { value, min, max }] of Object.entries(measurements)) {
    const num = Number(value);
    console.log(`Validating ${key}: raw value = "${value}", parsed as number = ${num}, expected range = [${min}, ${max}]`);
    if (isNaN(num)) {
      console.error(`Validation error: Invalid ${key} - not a number.`);
      throw new ValidationError(`Invalid ${key}: must be a number`);
    }
    if (num < min || num > max) {
      console.error(`Validation error: Invalid ${key} - value ${num} is not between ${min} and ${max}`);
      throw new ValidationError(`Invalid ${key}: must be between ${min} and ${max}`);
    }
  }

  console.log('--- Portfolio Validation Passed ---');
  next();
};

const validateContact = (req, res, next) => {
  const { brand, email, phone, location, workDetails, portfolio } = req.body;

  if (!brand?.trim()) {
    throw new ValidationError('Brand name is required');
  }

  if (!VALIDATION.EMAIL_REGEX.test(email)) {
    throw new ValidationError('Invalid email address');
  }

  if (!phone?.trim()) {
    throw new ValidationError('Phone number is required');
  }

  if (!location?.trim()) {
    throw new ValidationError('Location is required');
  }

  if (!workDetails?.trim()) {
    throw new ValidationError('Work details are required');
  }

  if (!portfolio) {
    throw new ValidationError('Portfolio reference is required');
  }

  next();
};

module.exports = {
  validatePortfolio,
  validateContact
};
  