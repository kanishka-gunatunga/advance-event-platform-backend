import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { put } from '@vercel/blob';
import { del } from '@vercel/blob';
import slugify from 'slugify';
import { convertToUTCFromColombo } from '../../middlewares/dateUtils';

const prisma = new PrismaClient();

export const createEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      event_type: z.string().min(1, 'Event type is required'),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input',
      errors: result.error.flatten(),
    });
  }


  const { user_id, event_type} = result.data;

  switch (event_type) {
    case 'movie':
      return createMovieEvent(req, res);
    case 'drama':
      return createDramaEvent(req, res);
    case 'concert':
      return createConcertEvent(req, res);
    case 'gaming':
      return createGamingEvent(req, res);
    case 'festival':
      return createFestivalEvent(req, res);
    case 'workshop':
      return createWorkshopEvent(req, res);
    case 'seminar':
      return createSeminarsEvent(req, res);
    case 'yacht':
      return createYachtEvent(req, res);
    case 'sport':
      return createSportEvent(req, res);
    case 'comedy':
      return createComedyEvent(req, res);
    case 'spiritual':
      return createSpiritualEvent(req, res);
    case 'webinar':
      return createWebinarEvent(req, res);
    case 'private':
      return createPrivateEvent(req, res);
    default:
      return res.status(400).json({ message: 'Invalid event type provided.' });
  }
};

const createMovieEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      trailer_links: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val); 
          } catch {
            return []; 
          }
        }
        return val;
      }, z.array(z.union([z.number(), z.string()])).optional()),
      venues: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val); 
          } catch {
            return []; 
          }
        }
        return val;
      }, z.array(z.union([z.number(), z.string()])).optional()),
      showtimes: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
          return val;
      },
        // Define the expected structure for each showtime object
        z.array(z.object({
            venue_id: z.string().min(1, 'Venue ID for showtime is required'),
            showtime_date: z.string().min(1, 'Showtime date is required'),
            showtime_time: z.string().min(1, 'Showtime time is required'),
        })).optional()
    ),
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().min(1, 'End date is required'),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description, trailer_links,venues, showtimes, start_date, end_date } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  const parsedStartDate = new Date(start_date);
  const parsedEndDate = new Date(end_date);
  try {
    const newEvent = await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'movie',
        name,
        slug: uniqueSlug, 
        description: description || null, 
        featured_image: featuredImageUrl, 
        trailer_links: trailer_links,
        start_date: parsedStartDate,
        end_date: parsedEndDate,
        status: 'active', 
      },
    });

    if (venues && venues.length > 0) {
      const vennuesConnects = venues.map((venuesInput) => {
        return {
            event_id: newEvent.id,
            venue_id: Number(venuesInput),
        };

      }).filter(Boolean);

      if (vennuesConnects.length > 0) {
        await prisma.eventVenue.createMany({
          data: vennuesConnects,
        });
      }
    }
    if (showtimes && showtimes.length > 0) {
      const showtimesData = showtimes.map((showtimeInput) => {

        const combinedDateTimeString = `${showtimeInput.showtime_date}T${showtimeInput.showtime_time}:00`; 
        const showtimeDateTime = new Date(combinedDateTimeString);

        const parsedShowtimeDate = new Date(showtimeInput.showtime_date + 'T00:00:00Z');
        const [hours, minutes, seconds] = showtimeInput.showtime_time.split(':').map(Number);
        const parsedShowtimeTime = new Date('2000-01-01T00:00:00Z'); 
        parsedShowtimeTime.setUTCHours(hours, minutes, seconds || 0, 0);

        return {
          event_id: newEvent.id,
          venue_id: parseInt(showtimeInput.venue_id),
          showtime_date: parsedShowtimeDate,
          showtime_time: parsedShowtimeTime,
        };
      }).filter(Boolean);

      if (showtimesData.length > 0) {
        await prisma.eventShowtime.createMany({
          data: showtimesData,
        });
      }
    }
    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};

const createDramaEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      artists: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return val;
      }, z.array(z.union([z.string(), z.number()])).optional()),
      venues: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val); 
          } catch {
            return []; 
          }
        }
        return val;
      }, z.array(z.union([z.number(), z.string()])).optional()),
      showtimes: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val); 
          } catch {
            return []; 
          }
        }
        return val;
      }, z.array(z.union([z.number(), z.string()])).optional()),
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().min(1, 'End date is required'),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description, artists,venues, showtimes, start_date, end_date } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for  event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }

  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }

  const parsedStartDate = new Date(start_date);
  const parsedEndDate = new Date(end_date);

  try {
    const newEvent = await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'drama', 
        name,
        slug: uniqueSlug,
        description: description || null,
        featured_image: featuredImageUrl,
        start_date: parsedStartDate,
        end_date: parsedEndDate,
        status: 'active',
      },
    });

    if (artists && artists.length > 0) {
      const artistConnects = artists.map((artistInput) => {
        if (typeof artistInput === 'number' || (typeof artistInput === 'string' && !isNaN(parseInt(artistInput)))) {
          return {
            event_id: Number(newEvent.id),
            artist_id: parseInt(artistInput.toString()),
          };
        } else if (typeof artistInput === 'string') {
          return {
            event_id: Number(newEvent.id),
            artist_name_manual: artistInput,
          };
        }
        return null;
      }).filter(Boolean);

      if (artistConnects.length > 0) {
        await prisma.eventArtist.createMany({
          data: artistConnects,
        });
      }
    }

    if (venues && venues.length > 0) {
      const vennuesConnects = venues.map((venuesInput) => {
        return {
            event_id: newEvent.id,
            venue_id: venuesInput,
        };

      }).filter(Boolean);

      if (vennuesConnects.length > 0) {
        await prisma.eventVenue.createMany({
          data: vennuesConnects,
        });
      }
    }
    if (showtimes && showtimes.length > 0) {
      const showtimesConnects = showtimes.map((showtimesInput) => {
        return {
            event_id: newEvent.id,
            showtime: showtimesInput,
        };

      }).filter(Boolean);

      if (showtimesConnects.length > 0) {
        await prisma.eventShowtime.createMany({
          data: showtimesConnects,
        });
      }
    }

    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};


const createConcertEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      artists: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return val;
      }, z.array(z.union([z.string(), z.number()])).optional()),
      genres: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val); 
          } catch {
            return []; 
          }
        }
        return val;
      }, z.array(z.union([z.number(), z.string()])).optional()),
      video_embeds: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val); 
          } catch {
            return []; 
          }
        }
        return val;
      }, z.array(z.union([z.number(), z.string()])).optional()),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description, artists, genres, video_embeds } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for  event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }

  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'concert', 
        name,
        slug: uniqueSlug,
        description: description || null,
        featured_image: featuredImageUrl,
        genres: genres,
        video_embeds: video_embeds,
        status: 'active',
      },
    });

    if (artists && artists.length > 0) {
      const artistConnects = artists.map((artistInput) => {
        if (typeof artistInput === 'number' || (typeof artistInput === 'string' && !isNaN(parseInt(artistInput)))) {
          return {
            event_id: newEvent.id,
            artist_id: parseInt(artistInput.toString()),
          };
        } else if (typeof artistInput === 'string') {
          return {
            event_id: newEvent.id,
            artist_name_manual: artistInput,
          };
        }
        return null;
      }).filter(Boolean);

      if (artistConnects.length > 0) {
        await prisma.eventArtist.createMany({
          data: artistConnects,
        });
      }
    }

    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};


const createGamingEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  try {
    await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'movie',
        name,
        slug: uniqueSlug, 
        description: description || null, 
        featured_image: featuredImageUrl, 
        status: 'active', 
      },
    });
    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};

const createFestivalEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  try {
    await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'festival',
        name,
        slug: uniqueSlug, 
        description: description || null, 
        featured_image: featuredImageUrl, 
        status: 'active', 
      },
    });
    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};


const createWorkshopEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      instructors: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return val;
      }, z.array(z.union([z.string(), z.number()])).optional()),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description, instructors } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for  event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }

  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'concert', 
        name,
        slug: uniqueSlug,
        description: description || null,
        featured_image: featuredImageUrl,
        status: 'active',
      },
    });

    if (instructors && instructors.length > 0) {
      const instructorConnects = instructors.map((instructorInput) => {
        if (typeof instructorInput === 'number' || (typeof instructorInput === 'string' && !isNaN(parseInt(instructorInput)))) {
          return {
            event_id: newEvent.id,
            instructor_id: parseInt(instructorInput.toString()),
          };
        } 
        return null;
      }).filter(Boolean);

      if (instructorConnects.length > 0) {
        await prisma.eventInstructor.createMany({
          data: instructorConnects,
        });
      }
    }

    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};


const createSeminarsEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      speakers: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return val;
      }, z.array(z.union([z.string(), z.number()])).optional()),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description, speakers } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for  event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }

  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }

  try {
    const newEvent = await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'seminar', 
        name,
        slug: uniqueSlug,
        description: description || null,
        featured_image: featuredImageUrl,
        status: 'active',
      },
    });

    if (speakers && speakers.length > 0) {
      const speakerConnects = speakers.map((speakerInput) => {
        if (typeof speakerInput === 'number' || (typeof speakerInput === 'string' && !isNaN(parseInt(speakerInput)))) {
          return {
            event_id: newEvent.id,
            speaker_id: parseInt(speakerInput.toString()),
          };
        } 
        return null;
      }).filter(Boolean);

      if (speakerConnects.length > 0) {
        await prisma.eventSpeaker.createMany({
          data: speakerConnects,
        });
      }
    }

    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};

const createYachtEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  try {
    await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'yacht',
        name,
        slug: uniqueSlug, 
        description: description || null, 
        featured_image: featuredImageUrl, 
        status: 'active', 
      },
    });
    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};


const createSportEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  try {
    await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'sport',
        name,
        slug: uniqueSlug, 
        description: description || null, 
        featured_image: featuredImageUrl, 
        status: 'active', 
      },
    });
    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};


const createComedyEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
      performers: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return val;
      }, z.array(z.union([z.string(), z.number()])).optional()),
      venues: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val); 
          } catch {
            return []; 
          }
        }
        return val;
      }, z.array(z.union([z.number(), z.string()])).optional()),
      showtimes: z.preprocess((val) => {
        if (typeof val === 'string') {
          try {
            return JSON.parse(val); 
          } catch {
            return []; 
          }
        }
        return val;
      }, z.array(z.union([z.number(), z.string()])).optional()),
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().min(1, 'End date is required'),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description, performers, venues, showtimes, start_date, end_date } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for  event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for  event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }

  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  const parsedStartDate = new Date(start_date);
  const parsedEndDate = new Date(end_date);
  try {
    const newEvent = await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'comedy', 
        name,
        slug: uniqueSlug,
        description: description || null,
        featured_image: featuredImageUrl,
        status: 'active',
        start_date: parsedStartDate,
        end_date: parsedEndDate,
      },
    });

    if (performers && performers.length > 0) {
      const performerConnects = performers.map((performerInput) => {
        if (typeof performerInput === 'number' || (typeof performerInput === 'string' && !isNaN(parseInt(performerInput)))) {
          return {
            event_id: newEvent.id,
            performer_id: parseInt(performerInput.toString()),
          };
        } 
        return null;
      }).filter(Boolean);

      if (performerConnects.length > 0) {
        await prisma.eventPerformer.createMany({
          data: performerConnects,
        });
      }
    }

     if (venues && venues.length > 0) {
      const vennuesConnects = venues.map((venuesInput) => {
        return {
            event_id: newEvent.id,
            venue_id: venuesInput,
        };

      }).filter(Boolean);

      if (vennuesConnects.length > 0) {
        await prisma.eventVenue.createMany({
          data: vennuesConnects,
        });
      }
    }
    if (showtimes && showtimes.length > 0) {
      const showtimesConnects = showtimes.map((showtimesInput) => {
        return {
            event_id: newEvent.id,
            showtime: showtimesInput,
        };

      }).filter(Boolean);

      if (showtimesConnects.length > 0) {
        await prisma.eventShowtime.createMany({
          data: showtimesConnects,
        });
      }
    }

    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};



const createSpiritualEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  try {
    await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'spiritual',
        name,
        slug: uniqueSlug, 
        description: description || null, 
        featured_image: featuredImageUrl, 
        status: 'active', 
      },
    });
    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};


const createWebinarEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  try {
    await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'webinar',
        name,
        slug: uniqueSlug, 
        description: description || null, 
        featured_image: featuredImageUrl, 
        status: 'active', 
      },
    });
    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};


const createPrivateEvent = async (req: Request, res: Response) => {
  const schema = z
    .object({
      user_id: z.string().min(1, 'User ID is required'),
      name: z.string().min(1, 'Name is required'),
      description: z.string().optional(),
    });

  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: result.error.flatten(),
    });
  }

  const { user_id, name, description } = result.data;

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const featuredImageFile = files?.featured_image?.[0];

  let featuredImageUrl: string | null = null;

  if (featuredImageFile) {
    if (!featuredImageFile.mimetype.startsWith('image/')) {
      return res.status(400).json({
        message: 'Invalid input for event',
        errors: {
          formErrors: [],
          fieldErrors: {
            featured_image: ['Featured image must be an image file.'],
          },
        },
      });
    }
    try {
      const { url } = await put(featuredImageFile.originalname, featuredImageFile.buffer, {
        access: 'public',
        addRandomSuffix: true,
      });
      featuredImageUrl = url;
    } catch (uploadError) {
      console.error('Error uploading featured image:', uploadError);
      return res.status(500).json({ message: 'Failed to upload featured image.' });
    }
  } else {
    return res.status(400).json({
      message: 'Invalid input for event',
      errors: {
        formErrors: [],
        fieldErrors: {
          featured_image: ['Featured image is required.'],
        },
      },
    });
  }
  let baseSlug = slugify(name, { lower: true, strict: true });
  let uniqueSlug = baseSlug;
  let suffix = 1;

  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${suffix++}`;
  }
  try {
    await prisma.event.create({
      data: {
        user_id: parseInt(user_id),
        event_type: 'private',
        name,
        slug: uniqueSlug, 
        description: description || null, 
        featured_image: featuredImageUrl, 
        status: 'active', 
      },
    });
    return res.status(201).json({ message: 'Event created successfully'});
  } catch (error) {
    console.error('Error creating  event:', error);
    return res.status(500).json({ message: 'Failed to create  event' });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const {
      startDate,  
      endDate,    
      artistId,  
      location,
      minPrice,  
      maxPrice  
    } = req.query;

    // Step 1: Get all active events
    let events = await prisma.event.findMany({
      where: {
        status: 'active',
        ...(location && { location: String(location) }),
        ...(startDate && endDate && {
          start_date_time: {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate)),
          }
        })
      }
    });

    // Step 2: Filter by artist (if artistId is provided)
    if (artistId) {
      const filterArtistIds = String(artistId).split(',').map(Number);
      events = events.filter(event => {
        const eventArtistIds = Array.isArray(event.artist_details)
          ? event.artist_details.map(Number)
          : [];
        return eventArtistIds.some(id => filterArtistIds.includes(id));
      });
    }

    // Step 3: Filter by price range (if given)
    if (minPrice || maxPrice) {
      const min = Number(minPrice) || 0;
      const max = Number(maxPrice) || Infinity;

      events = events.filter(event => {
        const tickets: any[] = Array.isArray(event.ticket_details) ? event.ticket_details : [];
        return tickets.some(ticket => ticket.price >= min && ticket.price <= max);
      });
    }

    // Step 4: Enrich each event with artists and ticket types
    const enhancedEvents = await Promise.all(events.map(async (event) => {
      const artistIds: number[] = Array.isArray(event.artist_details)
        ? event.artist_details.map(Number)
        : [];

      const ticketDetails: any[] = Array.isArray(event.ticket_details)
        ? event.ticket_details
        : [];

      const artists = await prisma.artist.findMany({
        where: { id: { in: artistIds } }
      });

      const ticketTypeIds = ticketDetails.map(t => t.ticketTypeId);
      const ticketTypes = await prisma.ticketType.findMany({
        where: { id: { in: ticketTypeIds } }
      });

      const enrichedTickets = ticketDetails.map(ticket => {
        const ticketType = ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
        return {
          ...ticket,
          ticketTypeName: ticketType?.name || 'Unknown'
        };
      });

      const enrichedArtists = artistIds.map(id => {
        const artist = artists.find(a => a.id === id);
        return {
          artistId: id,
          artistName: artist?.name || 'Unknown'
        };
      });

      return {
        ...event,
        ticket_details: enrichedTickets,
        artist_details: enrichedArtists
      };
    }));

    return res.json({ events: enhancedEvents });

  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ message: 'Failed to fetch events.' });
  }
};

export const getTrendingEvents = async (req: Request, res: Response) => {
  // 1. Fetch all active events
  const allActiveEvents = await prisma.event.findMany({
    where: { status: 'active' },
  });

  // 2. For each event, count the associated orders
  const eventsWithOrderCounts = await Promise.all(
    allActiveEvents.map(async (event) => {
      const orderCount = await prisma.order.count({
        where: {
          event_id: String(event.id), // Assuming 'eventId' column in your 'Order' table
        },
      });
      return {
        ...event,
        orderCount: orderCount,
      };
    })
  );

  // 3. Sort events by order count in descending order and take the top 8
  const sortedEvents = eventsWithOrderCounts.sort(
    (a, b) => b.orderCount - a.orderCount
  );

  const top8Events = sortedEvents.slice(0, 8);

  // 4. Enhance the top 8 events with artist and ticket details
  const enhancedEvents = await Promise.all(
    top8Events.map(async (event) => {
      const artistIds: number[] = Array.isArray(event.artist_details)
        ? (event.artist_details as any[]).map(Number)
        : [];

      const ticketDetails: any[] = Array.isArray(event.ticket_details)
        ? (event.ticket_details as any[])
        : [];

      const artists = await prisma.artist.findMany({
        where: { id: { in: artistIds } },
      });

      const ticketTypeIds = ticketDetails.map((t) => t.ticketTypeId);
      const ticketTypes = await prisma.ticketType.findMany({
        where: { id: { in: ticketTypeIds } },
      });

      const enrichedTickets = ticketDetails.map((ticket) => {
        const ticketType = ticketTypes.find((tt) => tt.id === ticket.ticketTypeId);
        return {
          ...ticket,
          ticketTypeName: ticketType?.name || 'Unknown',
        };
      });

      const enrichedArtists = artistIds.map((id) => {
        const artist = artists.find((a) => a.id === id);
        return {
          artistId: id,
          artistName: artist?.name || 'Unknown',
        };
      });

      // Remove the temporary 'orderCount' property if you don't want it in the final response
      const { orderCount, ...eventWithoutOrderCount } = event;

      return {
        ...eventWithoutOrderCount,
        ticket_details: enrichedTickets,
        artist_details: enrichedArtists,
        orderCount: orderCount, // Keep orderCount if you want to expose it
      };
    })
  );

  return res.json({
    events: enhancedEvents,
  });
};

export const getUpcomingEvents = async (req: Request, res: Response) => {
  const currentDate = new Date();

  const events = await prisma.event.findMany({
    where: {
      status: 'active',
      start_date_time: {
        gt: currentDate,
      },
    },
    orderBy: {
      start_date_time: 'asc',
    },
    take: 8,
  });

   const enhancedEvents = await Promise.all(events.map(async (event) => {

    const artistIds: number[] = Array.isArray(event.artist_details)
      ? event.artist_details.map(Number)
      : [];

    const ticketDetails: any[] = Array.isArray(event.ticket_details)
      ? event.ticket_details
      : [];

    const artists = await prisma.artist.findMany({
      where: { id: { in: artistIds } }
    });

    const ticketTypeIds = ticketDetails.map(t => t.ticketTypeId);
    const ticketTypes = await prisma.ticketType.findMany({
      where: { id: { in: ticketTypeIds } }
    });

    const enrichedTickets = ticketDetails.map(ticket => {
      const ticketType = ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
      return {
        ...ticket,
        ticketTypeName: ticketType?.name || 'Unknown'
      };
    });

    const enrichedArtists = artistIds.map(id => {
      const artist = artists.find(a => a.id === id);
      return {
        artistId: id,
        artistName: artist?.name || 'Unknown'
      };
    });

    return {
      ...event,
      ticket_details: enrichedTickets,
      artist_details: enrichedArtists
    };
  }));

  return res.json({
    events:enhancedEvents
  });
};
export const getEventDetails = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    const event = await prisma.event.findFirst({
      where: { slug },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // --- Debugging: Check raw data types and values ---
    console.log('Raw event.artist_details:', event.artist_details, typeof event.artist_details);
    console.log('Raw event.ticket_details:', event.ticket_details, typeof event.ticket_details);
    // --- End Debugging ---


    const artistIds: number[] = Array.isArray(event.artist_details)
      ? event.artist_details.map(Number)
      : [];

    const artists = await prisma.artist.findMany({
      where: { id: { in: artistIds } },
    });

    const enrichedArtists = artistIds.map(id => {
      const artist = artists.find(a => a.id === id);
      return {
        artistId: id,
        artistName: artist?.name || 'Unknown',
      };
    });

    let ticketDetails: any[] = [];
    const rawTicketDetails = event.ticket_details; // Store the raw value

    // Robustly handle ticket_details, assuming it might be a JSON string or an array
    if (typeof rawTicketDetails === 'string') {
      try {
        const parsed = JSON.parse(rawTicketDetails);
        if (Array.isArray(parsed)) {
          ticketDetails = parsed;
        } else {
          console.warn('ticket_details is a string but not a JSON array:', rawTicketDetails);
        }
      } catch (e) {
        console.error('Error parsing event.ticket_details as JSON string:', e);
        // If it fails to parse, assume it's not a valid JSON array string
      }
    } else if (Array.isArray(rawTicketDetails)) {
      ticketDetails = rawTicketDetails;
    } else if (rawTicketDetails !== null && rawTicketDetails !== undefined) {
        console.warn('event.ticket_details is neither an array nor a string:', rawTicketDetails);
    }
    // If it's null/undefined or an invalid format, ticketDetails remains []

    const ticketTypeIds = ticketDetails.map(t => t.ticketTypeId).filter(id => id !== undefined); // Ensure valid IDs

    const ticketTypes = await prisma.ticketType.findMany({
      where: { id: { in: ticketTypeIds } },
    });

    const enrichedTickets = ticketDetails.map(ticket => {
      const ticketType = ticketTypes.find(tt => tt.id === ticket.ticketTypeId);
      return {
        ...ticket,
        ticketTypeName: ticketType?.name || 'Unknown',
      };
    });

    const enrichedEvent = {
      ...event,
      artist_details: enrichedArtists,
      ticket_details: enrichedTickets,
    };

    return res.json(enrichedEvent);
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
};

export const getEventSeats = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const event = await prisma.event.findFirst({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

  
    return res.json(event.seats);
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const getLocations = async (req: Request, res: Response) => {
  try {
  
    const locations = [
      "BMICH",
      "Nelum Pokuna",
      "Musaeus College",
      "Bishop Collage"
    ];
    return res.json(locations);
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getArtists = async (req: Request, res: Response) => {
  try {
  
    const artists = await prisma.artist.findMany({
      where: { status : 'active' },
    });

    return res.json(artists);
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};