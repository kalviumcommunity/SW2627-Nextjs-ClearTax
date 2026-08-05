import { prisma } from "../lib/prisma.js";

const SAFE_USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  profilePicture: true,
  createdAt: true,
};

export async function createUser(data) {
  return prisma.user.create({ data });
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id: Number(id) },
    select: SAFE_USER_FIELDS,
  });
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id: Number(id) },
    data,
    select: SAFE_USER_FIELDS,
  });
}
