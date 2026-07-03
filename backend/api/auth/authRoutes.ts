import { Router } from 'express';
import { register, login, googleAuth, refreshToken, logout } from '../../controllers/auth/authController';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// POST /auth/register
router.post('/register', register);

// POST /auth/login
router.post('/login', login);

// POST /auth/google — Google OAuth (send Google ID token)
router.post('/google', googleAuth);

// POST /auth/refresh — get new access token from refresh token
router.post('/refresh', refreshToken);

// POST /auth/logout — clear refresh token (auth required)
router.post('/logout', authMiddleware, logout);

export default router;
