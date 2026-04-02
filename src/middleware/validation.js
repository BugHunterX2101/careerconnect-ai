const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

const authValidators = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special char'),
    body('firstName').trim().notEmpty().isLength({ max: 50 }).matches(/^[a-zA-Z\s]+$/).withMessage('Valid first name required'),
    body('role').isIn(['jobseeker', 'employer', 'admin']).withMessage('Invalid role')
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password required')
  ]
};

const jobValidators = {
  create: [
    body('title').trim().notEmpty().isLength({ max: 100 }),
    body('description').trim().notEmpty().isLength({ max: 5000 }),
    body('salary').optional().isNumeric().isFloat({ min: 0, max: 10000000 }),
    body('location').trim().notEmpty().isLength({ max: 100 }),
    body('requirements').isArray(),
    body('requirements.*').trim().isLength({ max: 200 })
  ]
};

module.exports = { validate, authValidators, jobValidators };
