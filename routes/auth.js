const { Router } = require('express');
const { createUser, loginUser, revalidateToken, requestPasswordReset, resetPassword, requestVerifiedEmail, verifyEmail } = require('../controllers/auth');
const { validatejwt } = require('../middlewares/validatejwt');

const router = Router();

router.post(
  '/register',
  createUser
);

router.post(
  '/login',
  loginUser
);

router.get('/renew', validatejwt, revalidateToken);

router.post('/request-password-reset', requestPasswordReset);

router.post('/request-verified-email', requestVerifiedEmail);

router.put('/reset-password', resetPassword);

router.put('/verify-email', verifyEmail);

module.exports = router;