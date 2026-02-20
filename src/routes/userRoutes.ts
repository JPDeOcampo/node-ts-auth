import express, { type Router }  from 'express';
import { authLimiter } from '@/middleware/rateLimiters.js';
import { protect } from '@/middleware/authenticate.js';
import { validate } from '@/middleware/validate.js';
import { emailSchema, updatePasswordSchema } from "@/validators/userValidator.js";


import { userRegister } from '@/controllers/auth/userRegister.js';
import { userLogin } from '@/controllers/auth/userLogin.js';
import { refreshToken } from '@/controllers/auth/refreshToken.js';
import { userUpdatePassword } from '@/controllers/auth/userUpdatePassword.js';
import { forgotPassword } from '@/controllers/auth/forgotPassword.js';
import { verifyResetPassword } from '@/controllers/auth/verifyResetPassword.js';
import { resetPassword } from '@/controllers/auth/resetPassword.js';

const router: Router = express.Router();

router.post('/v1/user/register', authLimiter, userRegister);
router.post('/v1/user/login', authLimiter, userLogin);
router.post('/v1/user/refresh-token', authLimiter, refreshToken);
router.put('/v1/user/update-password/:id', authLimiter, protect, validate(updatePasswordSchema), userUpdatePassword);

// Password reset flow
router.post("/v1/user/forgot-password", authLimiter, validate(emailSchema), forgotPassword);
router.post("/v1/user/reset/verify-reset-password", verifyResetPassword);
router.post("/v1/user/reset/reset-password", resetPassword)

export default router;

