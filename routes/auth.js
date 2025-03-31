const { Router } = require('express');
const { createUser, loginUser, revalidateToken, requestPasswordReset, resetPassword, requestVerifiedEmail, verifyEmail, deleteUser, logoutUser } = require('../controllers/auth');
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

router.post('/logout', logoutUser);

router.put('/reset-password', resetPassword);

router.put('/verify-email', verifyEmail);

router.delete('/delete-account', deleteUser);

module.exports = router;