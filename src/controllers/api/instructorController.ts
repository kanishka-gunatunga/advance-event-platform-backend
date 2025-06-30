import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createInstructor = async (req: Request, res: Response) => {
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
    await prisma.instructor.create({
      data: {
        user_id:parseInt(user_id),
        name,
        description,
        status: 'active',
      },
    });

    return res.status(200).json({ message: 'Instructor added successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};


export const getInstructors = async (req: Request, res: Response) => {
   const userId = parseInt(req.params.id);
   const instructors = await prisma.instructor.findMany({ where: { user_id: userId } });

   return res.status(200).json(instructors);
};


export const editInstructorGet = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const instructor = await prisma.instructor.findFirst({ where: { id: id } });

   return res.status(200).json(instructor);
};

export const editInstructorPost = async (req: Request, res: Response) => {
    
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
    const instructor = await prisma.instructor.findUnique({
      where: { id: id }
    });

    if (!instructor) {
       return res.status(400).json({ message: 'Instructor not found.' });
    }

    await prisma.instructor.update({
      where: { id: id },
      data: {
        name,
        description
      },
    });

     return res.status(200).json({ message: 'Instructor updated  successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const activateInstructor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.instructor.update({
      where: { id },
      data: { status: 'active' },
    });
   return res.status(200).json({ message: 'Instructor activated successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const deactivateInstructor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.instructor.update({
      where: { id },
      data: { status: 'inactive' },
    });
   return res.status(200).json({ message: 'Instructor deactivated successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};