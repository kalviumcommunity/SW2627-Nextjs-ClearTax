import {prisma} from "../lib/prisma.js";

export async function createUser(userData) {

    return await prisma.user.create({
        data: userData,
    })
}


export async function findUserByEmail(email){

    return await prisma.user.findUnique({
        where: {
            email
        }
    })
} 

export async function findUserById(id){

    return await prisma.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            profilePicture: true,
            createdAt: true,
        },
    })
}

export async function updateUser(id, data) {
    return await prisma.user.update({
        where: { id: parseInt(id) },
        data,
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            profilePicture: true,
            createdAt: true,
        }
    })
}