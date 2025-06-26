import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import transporter from '../../services/mailTransporter';
import ejs from 'ejs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

export const organizationRegister = async (req: Request, res: Response) => {
    const schema = z
    .object({
      organization_name: z.string().min(1, 'Organization name is required'),
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
  const { email, password, contact_number, organization_name} =  result.data;

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
        user_role: 3,
        is_verified: 0,
        otp: null,
        status: 'active',
      },
    });

    await prisma.organizationDetails.create({
      data: {
        user_id: user.id,
        contact_number,
        organization_name,
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


export const venueRegister = async (req: Request, res: Response) => {
    const schema = z
    .object({
      venue_name: z.string().min(1, 'Venue name is required'),
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
  const { email, password, contact_number, venue_name} =  result.data;

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
        user_role: 4,
        is_verified: 0,
        otp: null,
        status: 'active',
      },
    });

    await prisma.venueDetails.create({
      data: {
        user_id: user.id,
        contact_number,
        venue_name,
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

const generateReferralCode = (userId: number): string => {
 
  const userIdPart = userId.toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `MKTREF${userIdPart}${randomPart}`;
};

export const marketingRegister = async (req: Request, res: Response) => {
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
        user_role: 5,
        is_verified: 0,
        otp: null,
        status: 'active',
      },
    });

    const referral_code = generateReferralCode(user.id);

    await prisma.marketingDetails.create({
      data: {
        user_id: user.id,
        first_name,
        last_name,
        contact_number,
        referral_code
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



export const artistRegister = async (req: Request, res: Response) => {
    const schema = z
    .object({
      artist_name: z.string().min(1, 'Venue name is required'),
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
  const { email, password, contact_number, artist_name} =  result.data;

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
        user_role: 6,
        is_verified: 0,
        otp: null,
        status: 'active',
      },
    });

    await prisma.artistDetails.create({
      data: {
        user_id: user.id,
        contact_number,
        artist_name,
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

export const googleAuth = async (req: Request, res: Response) => {
  const result = req.body;

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for Google Auth',
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { id_token, user_type } = result;

  try {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error("GOOGLE_CLIENT_ID is not defined in environment variables.");
    }
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Failed to verify Google ID token or email not found.' });
    }

    const email = payload.email;
    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';
    const name = payload.name || ''; // Full name

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

      return res.json({
        message: 'User login successfully via Google.',
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      });

    }

    let userRole: number;

    if (user_type === 'customer') {
      userRole = 2; 
    } else if (user_type === 'organization') {
      userRole = 3; 
    } else if (user_type === 'venue') {
      userRole = 4;
    } else if (user_type === 'marketing') {
      userRole = 5;
    } else if (user_type === 'artist') {
      userRole = 6;
    } else {
      return res.status(400).json({ message: 'Invalid user_type provided.' });
    }

    user = await prisma.user.create({
      data: {
        email,
        user_role: userRole,
        is_verified: 1,
        otp: null,
        otp_expires_at: null,
        status: 'active',
      },
    });

    if (user_type === 'customer') {
      await prisma.customerDetails.create({
      data: {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
      },
    });
    } else if (user_type === 'organization') {
      await prisma.organizationDetails.create({
      data: {
        user_id: user.id,
        organization_name: name || `${firstName} ${lastName}'s Organization`,
      },
    });
    }
    else if (user_type === 'venue') {
      await prisma.venueDetails.create({
      data: {
        user_id: user.id,
        venue_name: name || `${firstName} ${lastName}'s Organization`,
      },
    });
    }
    else if (user_type === 'marketing') {
      const referral_code = generateReferralCode(user.id);
      await prisma.marketingDetails.create({
        data: {
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          referral_code
        },
      });
    }
    else if (user_type === 'artist') {
      await prisma.artistDetails.create({
      data: {
        user_id: user.id,
        artist_name: name || `${firstName} ${lastName}'s Organization`,
      },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

      return res.json({
        message: 'User registered successfully via Google.',
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      });

  } catch (err: any) {
    console.error('Google Auth error:', err);
    if (err.message.includes('No pem found for certificate')) {
        return res.status(401).json({ message: 'Google ID token verification failed. Ensure GOOGLE_CLIENT_ID is correct and the token is valid.' });
    }
    return res.status(500).json({ message: 'Internal server error during Google authentication.' });
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
    where: { id: userId }
  });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }
  
  let userDetails: any = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
  };

  switch (user.user_role) {
      case 2: 
        const customerDetails = await prisma.customerDetails.findUnique({
          where: {
            user_id: user.id,
          },
        });
        if (customerDetails) {
          userDetails = { ...userDetails, ...customerDetails };
        }
        break;
      case 3:
        const organizationDetails = await prisma.organizationDetails.findUnique({
          where: {
            user_id: user.id,
          },
        });
        if (organizationDetails) {
          userDetails = { ...userDetails, ...organizationDetails };
        }
        break;
      case 4: 
        const venueDetails = await prisma.venueDetails.findUnique({
          where: {
            user_id: user.id,
          },
        });
        if (venueDetails) {
          userDetails = { ...userDetails, ...venueDetails };
        }
        break;
      case 5: 
        const marketingDetails = await prisma.marketingDetails.findUnique({
          where: {
            user_id: user.id,
          },
        });
        if (marketingDetails) {
          userDetails = { ...userDetails, ...marketingDetails };
        }
        break;
      case 6: 
        const artistDetails = await prisma.artistDetails.findUnique({
          where: {
            user_id: user.id,
          },
        });
        if (artistDetails) {
          userDetails = { ...userDetails, ...artistDetails };
        }
        break;  
      default:
   
        break;
    }
    return res.status(200).json(userDetails);

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
