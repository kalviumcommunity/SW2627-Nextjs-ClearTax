import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, findUserById, updateUser } from "../repositories/user.repository.js";
import { sendResetEmail } from "./email.service.js";

export const otpStore = globalThis.otpStore || (globalThis.otpStore = new Map());

export async function signup({ name, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("Email already registered");

  const hashedPassword = await bcrypt.hash(password, 10);
  return createUser({ name, email, password: hashedPassword });
}

export async function login({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Password not valid");

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    },
  };
}

export async function getCurrentUser(userId) {
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function updateUserProfile(userId, updateData) {
  const user = await findUserById(userId);
  if (!user) throw new Error("User not found");

  const payload = {};
  if (updateData.name !== undefined) payload.name = updateData.name;
  if (updateData.profilePicture !== undefined) payload.profilePicture = updateData.profilePicture;

  if (updateData.newPassword) {
    const dbUser = await findUserByEmail(user.email);
    const isValid = await bcrypt.compare(updateData.oldPassword || "", dbUser.password);
    if (!isValid) throw new Error("Current password is not valid");

    payload.password = await bcrypt.hash(updateData.newPassword, 10);
  }

  return updateUser(userId, payload);
}

export async function requestPasswordReset(email) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("User with this email does not exist");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

  await sendResetEmail(email, otp);
  return { success: true };
}

export async function verifyOTP(email, otp) {
  const stored = otpStore.get(email);
  if (!stored) throw new Error("No password reset request found for this email");

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    throw new Error("Reset code has expired");
  }

  if (stored.otp !== otp) throw new Error("Invalid reset code");
  return { success: true };
}

export async function resetPassword(email, otp, newPassword) {
  await verifyOTP(email, otp);

  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const user = await findUserByEmail(email);
  if (!user) throw new Error("User not found");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUser(user.id, { password: hashedPassword });
  otpStore.delete(email);

  return { success: true };
}
