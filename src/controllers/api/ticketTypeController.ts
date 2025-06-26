import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createTicketType = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.number().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      color: z.string().min(1, 'Color is required'),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }


  const { user_id, name,color} = result.data;

  try {
    await prisma.ticketType.create({
      data: {
        user_id,
        name,
        color,
        status: 'active',
      },
    });

    return res.status(200).json({ message: 'Ticket type added successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};