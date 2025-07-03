import express from 'express';
import { login, customerRegister,organizationRegister, venueRegister,marketingRegister,artistRegister, googleAuth, updateProfileSettings,
updateSecuritySettings,bookingHistory,paymentHistory,getUserDetails,forgotPassword, validateOtp, resetPassword,resendOtp } from '../../controllers/api/userController';
import { createTicketType, getTicketTypes, activateTicketType, deactivateTicketType ,editTicketTypeGet, editTicketTypePost} from '../../controllers/api/ticketTypeController';
import { createInstructor, getInstructors, activateInstructor, deactivateInstructor ,editInstructorGet, editInstructorPost} from '../../controllers/api/instructorController';
import { createPerformer, getPerformers, activatePerformer, deactivatePerformer ,editPerformerGet, editPerformerPost} from '../../controllers/api/performerController';

import { createSpeaker, getSpeakers, activateSpeaker, deactivateSpeaker ,editSpeakerGet, editSpeakerPost} from '../../controllers/api/speakerController';
import { createEvent, getAllEvents,getTrendingEvents,getUpcomingEvents,getEventDetails,getEventSeats,getLocations,getArtists } from '../../controllers/api/eventController';
import { organizationProfilePost} from '../../controllers/api/organizationAccountController';
import { createInquiry} from '../../controllers/api/inquiryController';
import { followUser , unfollowUser} from '../../controllers/api/followController';

import { checkout} from '../../controllers/api/checkoutController';
import { selectSeat,resetSeats,unselectSeat} from '../../controllers/api/seatController';
import { authenticate } from '../../middlewares/authMiddleware';
import upload from '../../middlewares/upload';
const router = express.Router();

//User
router.post('/customer-register', customerRegister);
router.post('/organization-register', organizationRegister);
router.post('/venue-register', venueRegister);
router.post('/marketing-register', marketingRegister);
router.post('/artist-register', artistRegister);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/validate-otp', validateOtp);
router.post('/reset-password', resetPassword);
router.get('/get-user-details/:id',authenticate, getUserDetails);
router.post('/update-profile-settings/:id',authenticate, updateProfileSettings);
router.post('/update-security-settings/:id',authenticate, updateSecuritySettings);
router.get('/booking-history/:id',authenticate, bookingHistory);
router.get('/payment-history/:id',authenticate, paymentHistory);
router.post('/resend-otp', resendOtp);

//Organization
router.post('/organization-profile/:id',upload.fields([{ name: 'banner', maxCount: 1 },{ name: 'logo', maxCount: 1 }]),authenticate, organizationProfilePost);

//Customer
router.post('/create-inquiry',authenticate, createInquiry);
router.post('/follow-user',authenticate, followUser);
router.post('/unfollow-user',authenticate, unfollowUser);

//Events
router.get('/get-all-events', getAllEvents);
router.get('/get-trending-events', getTrendingEvents);
router.get('/get-upcoming-events', getUpcomingEvents);
router.get('/get-event-details/:slug', getEventDetails);
router.get('/get-locations', getLocations);
router.get('/get-artists', getArtists);

//Booking
router.post('/select-seat', selectSeat);
router.post('/reset-seats', resetSeats);
router.get('/get-event-seats/:id', getEventSeats);
router.post('/unselect-seat', unselectSeat);

//Checkout
router.post('/checkout', checkout);

//Google Auth
router.post('/auth/google', googleAuth);


//Event Related CRUD
//Ticket Type
router.post('/create-ticket-type',authenticate, createTicketType);
router.get('/get-user-ticket-types/:id',authenticate, getTicketTypes);
router.get('/edit-ticket-type/:id',authenticate, editTicketTypeGet);
router.post('/edit-ticket-type/:id',authenticate, editTicketTypePost);
router.get('/activate-ticket-type/:id',authenticate, activateTicketType);
router.get('/deactivate-ticket-type/:id',authenticate, deactivateTicketType);

//Instructor
router.post('/create-instructor',authenticate, createInstructor);
router.get('/get-user-instructors/:id',authenticate, getInstructors);
router.get('/edit-instructor/:id',authenticate, editInstructorGet);
router.post('/edit-instructor/:id',authenticate, editInstructorPost);
router.get('/activate-instructor/:id',authenticate, activateInstructor);
router.get('/deactivate-instructor/:id',authenticate, deactivateInstructor);

//Speaker
router.post('/create-speaker',authenticate, createSpeaker);
router.get('/get-user-speakers/:id',authenticate, getSpeakers);
router.get('/edit-speaker/:id',authenticate, editSpeakerGet);
router.post('/edit-speaker/:id',authenticate, editSpeakerPost);
router.get('/activate-speaker/:id',authenticate, activateSpeaker);
router.get('/deactivate-speaker/:id',authenticate, deactivateSpeaker);

//Performer
router.post('/create-performer',authenticate, createPerformer);
router.get('/get-user-performers/:id',authenticate, getPerformers);
router.get('/edit-performer/:id',authenticate, editPerformerGet);
router.post('/edit-performer/:id',authenticate, editPerformerPost);
router.get('/activate-performer/:id',authenticate, activatePerformer);
router.get('/deactivate-performer/:id',authenticate, deactivatePerformer);

//Event
router.post('/create-event',upload.fields([{ name: 'featured_image', maxCount: 1 }]),authenticate, createEvent);
export default router;
 