import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import transporter from '../../services/mailTransporter';
import ejs from 'ejs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET!;

export const customerRegister = async (req: Request, res: Response) => {
    const schema = z
    .object({
      first_name: z.string().min(1, 'First name is required'),
      last_name: z.string().min(1, 'Last name is required'),
      contact_number: z.string().min(1, 'Contact number is required'),
      email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      confirm_password: z.string().min(1, 'Confirm password is required'),
    })
    .refine((data) => data.password === data.confirm_password, {
      path: ['confirm_password'],
      message: 'Passwords do not match',
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
    message: 'Invalid input',
    errors: result.error.flatten(),
  });
  }
  const { email, password, first_name, last_name, contact_number} =  result.data;

  try {
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        user_role: 2,
        is_verified: 0,
        otp: null,
        status: 'active',
      },
    });

    await prisma.customerDetails.create({
      data: {
        user_id: user.id,
        first_name,
        last_name,
        contact_number,
      },
    });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const templatePath = path.join(__dirname, '../../views/email-templates/confirm-email-template.ejs');
    const emailHtml = await ejs.renderFile(templatePath, {
        otp: otp,
    });

    await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: email,
        subject: 'Confirm Your Account',
        html: emailHtml,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otp,
        otp_expires_at: otpExpiresAt,
      },
    });

    return res.status(201).json({ message: 'User registered successfully. Please confirm your account to login.' });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {

  // console.log('BODY:', req.body);
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
  });

  const result = loginSchema.safeParse(req.body);

if (!result.success) {
  return res.status(400).json({
    message: 'Invalid input',
    errors: result.error.flatten(),
  });
}

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email },include: { customerserDetails: true }, });
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  if (user.is_verified == 0) {
    return res.status(400).json({ message: 'Please verify your account to login' });
  }
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
     return res.status(400).json({ message: 'Invalid credentials' });
   
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
};


export const updateProfileSettings = async (req: Request, res: Response) => {

  const userId = parseInt(req.params.id);

  const schema = z
    .object({
      first_name: z.string().min(1, 'First name is required'),
      last_name: z.string().min(1, 'Last name is required'),
      contact_number: z.string().min(1, 'Contact number is required'),
      email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
      country: z.string().optional(),
      gender: z.string().optional(),
      dob: z.preprocess(
      (val) => {
        if (typeof val === 'string' || val instanceof Date) {
          const date = new Date(val);
          return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
      },
      z.date().optional()
    ),
      address: z.string().optional(),
      city: z.string().optional(),
    });


  const result = schema.safeParse(req.body);

  if (!result.success) {
  return res.status(400).json({
    message: 'Invalid input',
    errors: result.error.flatten(),
  });
  }

  const { first_name, last_name, contact_number, email, country, gender, dob, address, city } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerserDetails: true },
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

    await prisma.user.update({
      where: { id: userId },
      data: {
        email
      },
    });

    await prisma.customerDetails.update({
      where: { user_id: userId },
      data: {
        first_name,
        last_name,
        contact_number,
        country,
        gender,
        dob,
        address,
        city,
      },
    });

     return res.status(201).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating admin:', err);
     return res.status(400).json({ message: 'An unexpected error occurred while updating the user.' });
  }
};

export const updateSecuritySettings = async (req: Request, res: Response) => {

  const userId = parseInt(req.params.id);

  const schema = z
    .object({
      old_password: z.string().min(1, 'Confirm password is required'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      confirm_password: z.string().min(1, 'Confirm password is required'),
    })
    .refine((data) => {
      if (data.password || data.confirm_password) {
        return data.password === data.confirm_password;
      }
      return true;
    }, {
      path: ['confirm_password'],
      message: 'Passwords do not match',
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
  return res.status(400).json({
    message: 'Invalid input',
    errors: result.error.flatten(),
  });
  }

  const {old_password, password } = result.data;

  try {

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customerserDetails: true },
    });

    if (!user) {
       return res.status(400).json({ message: 'User not found.' });
    }

    if (password) {

      const isMatch = await bcrypt.compare(old_password, user.password);
      if (!isMatch) {
         return res.status(400).json({ message: 'Current password is incorrect.' });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });

    return res.status(201).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating admin:', err);
    return res.status(400).json({ message: 'An unexpected error occurred while updating the user.' });
  }
};
export const bookingHistory = async (req: Request, res: Response) => {
  const userId = req.params.id;

  try {
    const orders = await prisma.order.findMany({
      where: { user_id: userId },
    });

    const bookingHistory = await Promise.all(
      orders.map(async (order) => {
        const event = await prisma.event.findUnique({
          where: { id: parseInt(order.event_id) },
        });

        if (!event) return null;

        const ticketCounts: { [key: string]: number } = {};
        
          if (Array.isArray(order.seat_ids)) {
            if (Array.isArray(event.seats)) {
              const seats = event.seats as Array<{ seatId: number; ticketTypeName: string }>;

              order.seat_ids.forEach((seatId) => {
                const seat = seats.find((s) => s.seatId === seatId);
                if (seat) {
                  if (!ticketCounts[seat.ticketTypeName]) {
                    ticketCounts[seat.ticketTypeName] = 1;
                  } else {
                    ticketCounts[seat.ticketTypeName]++;
                  }
                }
              });
            } else {
              console.warn(`Event seats is not an array for event ${event.id}`);
            }
          } else {
            console.warn(`Order ${order.id} seat_ids is not an array`);
          }

        const tickets = Object.entries(ticketCounts).map(([type, count]) => ({
          type,
          count,
        }));

        return {
          event_name: event.name,
          start_date_time: event.start_date_time,
          tickets,
        };
      })
    );

    return res.json({
      booking_history: bookingHistory.filter(Boolean), 
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    return res.status(500).json({ message: 'Failed to fetch booking history' });
  }
};

export const paymentHistory = async (req: Request, res: Response) => {
  const userId = req.params.id;

  try {
    const orders = await prisma.order.findMany({ where: { user_id: userId } });

    return res.json({
      orders: orders,
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};


export const getUserDetails = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customerserDetails: true },
  });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  return res.json({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    customerserDetails: {
      first_name: user.customerserDetails?.first_name,
      last_name: user.customerserDetails?.last_name,
      contact_number: user.customerserDetails?.contact_number,
      nic_passport: user.customerserDetails?.nic_passport,
      country: user.customerserDetails?.country,
      gender: user.customerserDetails?.gender,
      dob: user.customerserDetails?.dob,
      address_line1: user.customerserDetails?.address_line1,
      address_line2: user.customerserDetails?.address_line2,
      city: user.customerserDetails?.city,
    }
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
  });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }

  const { email } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const templatePath = path.join(__dirname, '../../views/email-templates/forgot-password-template.ejs');
    const emailHtml = await ejs.renderFile(templatePath, {
        otp: otp,
    });

    await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: email,
        subject: 'Password Reset OTP',
        html: emailHtml,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otp
      },
    });

    return res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Error during forgot password process:', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const validateOtp = async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
    otp: z.string({ required_error: 'OTP is required' }),
    otp_type: z.string({ required_error: 'OTP Type is required' }),
  });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }

  const { email, otp, otp_type } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { customerDetails: true } // Corrected typo here, assuming your model is 'customerDetails'
    });

    if (!user || !user.otp) {
      return res.status(400).json({ message: 'Invalid email address or OTP not requested.' });
    }
    if (!user.customerDetails) { // Corrected typo
      return res.status(400).json({ message: 'Invalid email address or OTP not requested.' });
    }

    // Check if OTP has expired
    if (user.otp_expires_at && new Date() > user.otp_expires_at) {
      // Clear expired OTP to prevent future validation attempts with it
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null,
          otp_expires_at: null,
        },
      });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP is valid and not expired
    if (otp_type === 'register') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null, // Clear OTP after successful validation
          otp_expires_at: null, // Clear expiration time
          is_verified: 1,
        },
      });

      const templatePath = path.join(__dirname, '../../views/email-templates/register-success-template.ejs');

      const emailHtml = await ejs.renderFile(templatePath, {
        first_name: user.customerDetails.first_name, // Corrected typo
      });

      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: email,
        subject: 'Welcome to Quick Tickets!',
        html: emailHtml,
      });

      return res.status(200).json({ message: 'OTP validated successfully. Account verified.', type: otp_type });
    } else {
      // For other OTP types (e.g., password reset), just clear the OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otp: null,
          otp_expires_at: null, // Clear expiration time
        },
      });
      return res.status(200).json({ message: 'OTP validated successfully.', type: otp_type });
    }

  } catch (err) {
    console.error('Error during OTP validation:', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};


export const resetPassword = async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirm_password, {
      path: ['confirm_password'],
      message: 'Passwords do not match',
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error during password update:', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string({ required_error: 'Email is required' }).email('Invalid email format'),
  });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }

  const { email } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    const templatePath = path.join(__dirname, '../../views/email-templates/resend-otp-template.ejs');
    const emailHtml = await ejs.renderFile(templatePath, {
      otp: otp,
    });

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'OTP Resend Request',
      html: emailHtml,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: otp,
        otp_expires_at: otpExpiresAt, // Store the new expiration time
      },
    });

    return res.status(200).json({ message: 'New OTP sent to your email and is valid for 10 minutes.' });
  } catch (err) {
    console.error('Error during resend OTP process:', err);
    return res.status(500).json({ message: 'An unexpected error occurred.' });
  }
};
