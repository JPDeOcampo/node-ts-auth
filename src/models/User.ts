import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  socialAccount?: boolean;
  refreshToken?: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
}

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
    refreshToken: { type: String },
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

export default mongoose.model<IUser>("User", userSchema);
