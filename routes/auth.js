const { Router } = require('express');
const { check } = require('express-validator');
const { validateFields } = require('../middlewares/validateFields');
const { createUser, loginUser, revalidateToken } = require('../controllers/auth');
const { validatejwt } = require('../middlewares/validatejwt');

const router = Router();

router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').isLength({ min: 6 }),
    validateFields
  ],
  createUser
)

router.post(
  '/login',
  [
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').not().isEmpty(),
    validateFields
  ],
  loginUser
);

router.get('/renew', validatejwt, revalidateToken);

module.exports = router;