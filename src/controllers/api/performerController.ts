import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createPerformer = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }


  const { user_id, name, description} = result.data;

  try {
    await prisma.performer.create({
      data: {
        user_id:parseInt(user_id),
        name,
        description,
        status: 'active',
      },
    });

    return res.status(200).json({ message: 'Performer added successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};


export const getPerformers = async (req: Request, res: Response) => {
   const userId = parseInt(req.params.id);
   const performers = await prisma.performer.findMany({ where: { user_id: userId } });

   return res.status(200).json(performers);
};


export const editPerformerGet = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const performer = await prisma.performer.findFirst({ where: { id: id } });

   return res.status(200).json(performer);
};

export const editPerformerPost = async (req: Request, res: Response) => {
    
  const schema = z
    .object({
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }


  const {name,description} = result.data;

   const id = Number(req.params.id);

  try {
    const performer = await prisma.performer.findUnique({
      where: { id: id }
    });

    if (!performer) {
       return res.status(400).json({ message: 'Performer not found.' });
    }

    await prisma.performer.update({
      where: { id: id },
      data: {
        name,
        description
      },
    });

     return res.status(200).json({ message: 'Performer updated  successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const activatePerformer = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.performer.update({
      where: { id },
      data: { status: 'active' },
    });
   return res.status(200).json({ message: 'Performer activated successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const deactivatePerformer = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.performer.update({
      where: { id },
      data: { status: 'inactive' },
    });
   return res.status(200).json({ message: 'Performer deactivated successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};