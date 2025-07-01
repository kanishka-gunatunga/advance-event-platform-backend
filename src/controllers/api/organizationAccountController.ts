
import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import transporter from '../../services/mailTransporter';
import ejs from 'ejs';
import path from 'path';
import { put } from '@vercel/blob';

const JWT_SECRET = process.env.JWT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const organizationProfilePost = async (req: Request, res: Response) => {

  const userId = parseInt(req.params.id);

  const schema = z
    .object({
      organization_name: z.string().min(1, 'Organization name is required'),
      contact_number: z.string().min(1, 'Contact number is required'),
      email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
      description: z.string().optional(),
      address: z.string().optional(),
      social_links: z.string().optional(),
    });


  const result = schema.safeParse(req.body);

  if (!result.success) {
  return res.status(400).json({
    message: 'Invalid input',
    errors: result.error.flatten(),
  });
  }

  const { organization_name, contact_number, email, description, address, social_links } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organizationDetails: true }
    });

    if (!user) {
       return res.status(400).json({ message: 'User not found.' });
    }

    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
         return res.status(400).json({ message: 'Email already exists.' });
      }
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const bannerImageFile = files?.banner?.[0];
    const logoImageFile = files?.logo?.[0];

    let bannerImageUrl: string | null = null;
    let logoImageUrl: string | null = null;
    
    if (user.organizationDetails) {
        bannerImageUrl = user.organizationDetails.banner;
        logoImageUrl = user.organizationDetails.logo;
    }
    if (bannerImageFile) {
        if (!bannerImageFile.mimetype.startsWith('image/')) {
             return res.status(400).json({
                message: 'Invalid input for event',
                errors: {
                formErrors: [],
                fieldErrors: {
                    banner: ['Banner image must be an image file.'],
                },
                },
            });
        }
        const { url } = await put(bannerImageFile.originalname, bannerImageFile.buffer, {
            access: 'public',
            addRandomSuffix: true,
        });
        bannerImageUrl = url;
    }
    if (logoImageFile) {
        if (!logoImageFile.mimetype.startsWith('image/')) {
            return res.status(400).json({
                message: 'Invalid input for event',
                errors: {
                formErrors: [],
                fieldErrors: {
                    logo: ['Logo image must be an image file.'],
                },
                },
            });
        }
        const { url } = await put(logoImageFile.originalname, logoImageFile.buffer, {
            access: 'public',
            addRandomSuffix: true,
        });
        logoImageUrl = url;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        email
      },
    });

    await prisma.organizationDetails.update({
      where: { user_id: userId },
      data: {
        organization_name,
        contact_number,
        description,
        address,
        social_links,
        banner: bannerImageUrl,
        logo: logoImageUrl,
      },
    });

     return res.status(201).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating admin:', err);
     return res.status(400).json({ message: 'An unexpected error occurred while updating the user.' });
  }
};