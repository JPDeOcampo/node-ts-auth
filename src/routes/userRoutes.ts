import express, { type Router }  from 'express';
import { userRegister } from '@/controllers/auth/userRegister.js';
import { loginUser } from '@/controllers/auth/userLogin.js';
import { refreshToken } from '@/controllers/auth/refreshToken.js';
import { authLimiter } from '@/middleware/rateLimiters.js';

const router: Router = express.Router();

router.post('/user/register', authLimiter, userRegister);
router.post('/user/login', authLimiter, loginUser);
router.post('/user/refreshToken', authLimiter, refreshToken);

export default router;

