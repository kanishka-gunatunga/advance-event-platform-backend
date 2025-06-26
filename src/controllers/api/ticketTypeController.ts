import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createTicketType = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
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
        user_id:parseInt(user_id),
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


export const getTicketTypes = async (req: Request, res: Response) => {
   const userId = parseInt(req.params.id);
   const ticketTypes = await prisma.ticketType.findMany({ where: { user_id: userId } });

   return res.status(200).json(ticketTypes);
};


export const editTicketTypeGet = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const ticketType = await prisma.ticketType.findFirst({ where: { id: id } });

   return res.status(200).json(ticketType);
};

export const editTicketTypePost = async (req: Request, res: Response) => {
    
  const schema = z
    .object({
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


  const {name,color} = result.data;

   const id = Number(req.params.id);

  try {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: id }
    });

    if (!ticketType) {
       return res.status(400).json({ message: 'Ticket type not found.' });
    }

    await prisma.ticketType.update({
      where: { id: id },
      data: {
        name,
        color
      },
    });

     return res.status(200).json({ message: 'Ticket type updated  successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const activateTicketType = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.ticketType.update({
      where: { id },
      data: { status: 'active' },
    });
   return res.status(200).json({ message: 'Ticket type activated successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const deactivateTicketType = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.ticketType.update({
      where: { id },
      data: { status: 'inactive' },
    });
   return res.status(200).json({ message: 'Ticket type deactivated successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};