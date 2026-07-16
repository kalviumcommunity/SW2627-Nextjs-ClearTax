import bcrypt from "bcryptjs"

import { createUser , findUserByEmail } from "@/repositories/user.repository"


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