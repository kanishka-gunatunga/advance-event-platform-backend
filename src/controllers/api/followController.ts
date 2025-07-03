import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

export const followUser = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      followed_by: z.string().min(1, 'Following by is required'),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }


  const { user_id,followed_by} = result.data;

  try {
    await prisma.follower.create({
      data: {
        user_id:parseInt(user_id),
        followed_by:parseInt(followed_by),

      },
    });

    return res.status(200).json({ message: 'Followed successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};


export const unfollowUser = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      followed_by: z.string().min(1, 'Following by is required'),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }


  const { user_id,followed_by} = result.data;

  try {
    await prisma.follower.delete({
      where: {
        user_id_followed_by: {
          user_id: parseInt(user_id),
          followed_by: parseInt(followed_by),
        },
      },
    });


    return res.status(200).json({ message: 'Unollowed successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};