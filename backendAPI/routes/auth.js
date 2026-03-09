import express from 'express';
import auth from '../middleware/auth.js';
import {
    register,
    registerValidation,
    login,
    loginValidation,
    getMe,
    refreshToken,
    logoutUser,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

router.get('/me', auth, getMe);
router.post('/refresh', auth, refreshToken);
router.post('/logout', auth, logoutUser);

export default router;
