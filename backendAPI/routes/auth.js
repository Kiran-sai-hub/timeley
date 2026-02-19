import express from 'express';
import auth from '../middleware/auth.js';
import {
    register,
    registerValidation,
    login,
    loginValidation,
    getMe,
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected route
router.get('/me', auth, getMe);

export default router;
