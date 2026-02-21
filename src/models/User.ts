import mongoose, { Document, Schema } from "mongoose";

interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  socialAccount?: boolean;
refreshTokens: IRefreshToken[];
  verificationCode?: string;
  verificationCodeExpires?: Date;
}

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const userSchema: Schema<IUser> = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    socialAccount: {
      type: Boolean,
      required: false,
    },
    refreshTokens: [refreshTokenSchema],
    verificationCode: {
      type: String,
      required: false,
    },
    verificationCodeExpires: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true },
);

// Indexing for performance and automatic cleanup
// userSchema.index({ email: 1 });

export default mongoose.model<IUser>("User", userSchema);
