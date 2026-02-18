const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    register,
    registerValidation,
    login,
    loginValidation,
    getMe,
} = require('../controllers/authController');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected route
router.get('/me', auth, getMe);

module.exports = router;
