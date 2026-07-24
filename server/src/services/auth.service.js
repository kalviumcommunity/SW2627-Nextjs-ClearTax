import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

import { createUser , findUserByEmail , findUserById, updateUser } from "../repositories/user.repository.js"


export async function signup(userData){

  const existingUser = await findUserByEmail(userData.email)

  if(existingUser){
    throw new Error("Email already registered")
  }

  const hashedPassword = await bcrypt.hash(userData.password , 10)

  return createUser({
    ...userData,
    password : hashedPassword
  })
}

export async function login(userData){

  const user = await findUserByEmail(userData.email)

  if(!user){
    throw new Error("User not found")
  }

  const isPasswordValid = await bcrypt.compare(
    userData.password,
    user.password
  )

  if(!isPasswordValid){
    throw new Error("Password not valid")
  }

  const token = jwt.sign(
    {
      id : user.id,
      email:user.email,
      role : user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn:"7d"
    }
  )

  return {
    token , 
    user : {
      id : user.id,
      name : user.name,
      email:user.email,
      role : user.role,
      profilePicture : user.profilePicture
    }
  }
}

export async function getCurrentUser(userId){

  const user = await findUserById(userId)

  if(!user){
    throw new Error("User not found")
  }

  return user;
}

export async function updateUserProfile(userId, updateData) {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const prismaUpdateData = {};

  if (updateData.name !== undefined) {
    prismaUpdateData.name = updateData.name;
  }

  if (updateData.profilePicture !== undefined) {
    prismaUpdateData.profilePicture = updateData.profilePicture;
  }

  if (updateData.newPassword) {
    const dbUser = await findUserByEmail(user.email);
    const isPasswordValid = await bcrypt.compare(
      updateData.oldPassword,
      dbUser.password
    );
    if (!isPasswordValid) {
      throw new Error("Current password is not valid");
    }

    const hashedNewPassword = await bcrypt.hash(updateData.newPassword, 10);
    prismaUpdateData.password = hashedNewPassword;
  }

  return await updateUser(userId, prismaUpdateData);
}