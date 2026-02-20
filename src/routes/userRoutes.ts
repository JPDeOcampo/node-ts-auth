import express, { type Router }  from 'express';
import { authLimiter } from '@/middleware/rateLimiters.js';
import { protect } from '@/middleware/authenticate.js';
import { validate } from '@/middleware/validate.js';
import { updatePasswordSchema } from "@/validators/userValidator.js";
import { userRegister } from '@/controllers/auth/userRegister.js';
import { userLogin } from '@/controllers/auth/userLogin.js';
import { refreshToken } from '@/controllers/auth/refreshToken.js';
import { userUpdatePassword } from '@/controllers/auth/userUpdatePassword.js';
import { forgotPassword } from '@/controllers/auth/forgotPassword.js';
import { verifyResetPassword } from '@/controllers/auth/verifyResetPassword.js';
import { resetPassword } from '@/controllers/auth/resetPassword.js';

const router: Router = express.Router();

router.post('/user/register', authLimiter, userRegister);
router.post('/user/login', authLimiter, userLogin);
router.post('/user/refresh-token', authLimiter, refreshToken);
router.put('/user/update-password/:id', authLimiter, protect, validate(updatePasswordSchema), userUpdatePassword);

// Password reset flow
router.post("/user/forgot-password", forgotPassword);
router.post("/user/reset/verify-reset-password", verifyResetPassword);
router.post("/user/reset/reset-password", resetPassword)

export default router;

