import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

export const createSpeaker = async (req: Request, res: Response) => {
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
    await prisma.speaker.create({
      data: {
        user_id:parseInt(user_id),
        name,
        description,
        status: 'active',
      },
    });

    return res.status(200).json({ message: 'Speaker added successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};


export const getSpeakers = async (req: Request, res: Response) => {
   const userId = parseInt(req.params.id);
   const speakers = await prisma.speaker.findMany({ where: { user_id: userId } });

   return res.status(200).json(speakers);
};


export const editSpeakerGet = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const speaker = await prisma.speaker.findFirst({ where: { id: id } });

   return res.status(200).json(speaker);
};

export const editSpeakerPost = async (req: Request, res: Response) => {
    
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
    const speaker = await prisma.speaker.findUnique({
      where: { id: id }
    });

    if (!speaker) {
       return res.status(400).json({ message: 'Speaker not found.' });
    }

    await prisma.speaker.update({
      where: { id: id },
      data: {
        name,
        description
      },
    });

     return res.status(200).json({ message: 'Speaker updated  successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const activateSpeaker = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.speaker.update({
      where: { id },
      data: { status: 'active' },
    });
   return res.status(200).json({ message: 'Speaker activated successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const deactivateSpeaker = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.speaker.update({
      where: { id },
      data: { status: 'inactive' },
    });
   return res.status(200).json({ message: 'Speaker deactivated successfully.' });
  } catch (err) {
    console.error('Error :', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};