import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createInquiry = async (req: Request, res: Response) => {
  const schema = z
    .object({
      organization_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      email: z.string().min(1, 'Email is required'),
      contact_no: z.string().min(1, 'Contact no is required'),
      subject: z.string().min(1, 'Subject is required'),
      message: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }


  const { organization_id, name, email, contact_no, subject, message} = result.data;

  try {
    await prisma.inquiry.create({
      data: {
        user_id:parseInt(organization_id),
        name,
        email,
        contact_no,
        subject,
        message,
      },
    });

    return res.status(200).json({ message: 'Inquiry added successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};
