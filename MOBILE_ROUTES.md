# Mobile App Routes Documentation

## Overview
This document lists all mobile app routes and their backend API connections.

## Base API URL
```
http://localhost:8001/api
```

## Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Public Routes

### `/onboarding`
- **Component**: `Onboarding.jsx`
- **Description**: App introduction slides
- **Backend**: None (static content)

### `/login`
- **Component**: `Login.jsx`
- **Description**: User login with phone number
- **Backend API**: 
  - `POST /api/auth/otp/send` - Send OTP to phone

### `/otp`
- **Component**: `OTP.jsx`
- **Description**: OTP verification
- **Backend API**:
  - `POST /api/auth/otp/verify` - Verify OTP and login/register
  - `POST /api/auth/otp/send` - Resend OTP

---

## Protected Routes

### `/` (Home)
- **Component**: `Home.jsx`
- **Description**: Main dashboard with categories, top venues, popular venues
- **Backend APIs**:
  - `GET /api/categories` - Get all categories
  - `GET /api/venues/top?limit=5` - Get top venues
  - `GET /api/venues/popular?limit=5` - Get popular venues
- **Auth**: Required

### `/services`
- **Component**: `Services.jsx`
- **Description**: List all service categories
- **Backend API**: 
  - `GET /api/categories` - Get all categories
- **Auth**: Required

### `/venues`
- **Component**: `Venues.jsx`
- **Description**: List all venues with search
- **Backend API**: 
  - `GET /api/venues?categoryId={id}` - Get venues by category
  - `GET /api/venues?search={query}` - Search venues
- **Auth**: Required

### `/venue/:id`
- **Component**: `VenueDetails.jsx`
- **Description**: Venue details page
- **Backend API**: 
  - `GET /api/venues/:id` - Get venue by ID
- **Auth**: Required

### `/booking`
- **Component**: `Booking.jsx`
- **Description**: List user bookings with filters
- **Backend API**: 
  - `GET /api/bookings?status={status}` - Get bookings by status
  - `GET /api/bookings` - Get all user bookings
- **Auth**: Required

### `/booking/:id`
- **Component**: `BookingDetails.jsx`
- **Description**: Booking details page
- **Backend API**: 
  - `GET /api/bookings/:id` - Get booking by ID
- **Auth**: Required

### `/booking-confirmation`
- **Component**: `BookingConfirmation.jsx`
- **Description**: Confirm booking and payment
- **Backend API**: 
  - `POST /api/bookings` - Create new booking
- **Auth**: Required

### `/booking/success`
- **Component**: `BookingSuccess.jsx`
- **Description**: Booking success confirmation
- **Backend**: Uses booking data from navigation state
- **Auth**: Required

### `/profile`
- **Component**: `Profile.jsx`
- **Description**: User profile menu
- **Backend**: None (navigation only)
- **Auth**: Required

### `/user-profile`
- **Component**: `UserProfile.jsx`
- **Description**: Edit user profile
- **Backend APIs**: 
  - `GET /api/auth/me` - Get current user
  - `PATCH /api/auth/me` - Update user profile
  - `DELETE /api/auth/me` - Delete user account
- **Auth**: Required

### `/support`
- **Component**: `TechnicalSupport.jsx`
- **Description**: Technical support contact form
- **Backend APIs**: 
  - `GET /api/settings` - Get app settings (contact info)
  - `POST /api/support` - Send support message (to be implemented)
- **Auth**: Required

### `/privacy`
- **Component**: `PrivacyPolicy.jsx`
- **Description**: Privacy policy page
- **Backend API**: 
  - `GET /api/content/privacy` - Get privacy policy content
- **Auth**: Required

### `/terms`
- **Component**: `TermsConditions.jsx`
- **Description**: Terms and conditions page
- **Backend API**: 
  - `GET /api/content/terms` - Get terms and conditions content
- **Auth**: Required

### `/search`
- **Component**: `Search.jsx`
- **Description**: Search venues, services, and bookings
- **Backend APIs**: 
  - `GET /api/venues?search={query}` - Search venues
  - `GET /api/services?search={query}` - Search services
  - `GET /api/bookings?userId={id}` - Get user bookings for search
- **Auth**: Required

### `/booking/add`
- **Component**: `AddBooking.jsx`
- **Description**: Add new booking form
- **Backend API**: 
  - `POST /api/bookings` - Create new booking
- **Auth**: Required

### `/create-account`
- **Component**: `CreateAccount.jsx`
- **Description**: Create new account
- **Backend API**: 
  - `POST /api/auth/register` - Register new user
- **Auth**: Required

### `/book-appointment`
- **Component**: `BookAppointment.jsx`
- **Description**: Book appointment
- **Backend API**: 
  - `POST /api/bookings` - Create booking
- **Auth**: Required

### `/additional-services`
- **Component**: `AdditionalServices.jsx`
- **Description**: Select additional services
- **Backend API**: 
  - `GET /api/services` - Get all services
- **Auth**: Required

### `/booking-location`
- **Component**: `BookingLocation.jsx`
- **Description**: Select booking location
- **Backend**: None (UI only)
- **Auth**: Required

### `/my-services`
- **Component**: `MyServices.jsx`
- **Description**: User's services
- **Backend API**: 
  - `GET /api/services?userId={id}` - Get user services
- **Auth**: Required

### `/wallet`
- **Component**: `Wallet.jsx`
- **Description**: User wallet/payments
- **Backend API**: 
  - `GET /api/payments?userId={id}` - Get user payments
- **Auth**: Required

### `/select-services`
- **Component**: `SelectServices.jsx`
- **Description**: Select services for booking
- **Backend API**: 
  - `GET /api/services` - Get all services
- **Auth**: Required

### `/customize-venue`
- **Component**: `CustomizeVenue.jsx`
- **Description**: Customize venue booking
- **Backend**: None (UI only)
- **Auth**: Required

### `/add-card`
- **Component**: `AddCard.jsx`
- **Description**: Add payment card
- **Backend API**: 
  - `POST /api/payments/cards` - Add payment card (to be implemented)
- **Auth**: Required

---

## Profile Sub-Routes (via navigation)

### `/profile/coupons`
- **Description**: User coupons
- **Status**: Route to be created
- **Backend API**: `GET /api/coupons?userId={id}` (to be implemented)

### `/profile/notifications`
- **Description**: User notifications
- **Status**: Route to be created
- **Backend API**: `GET /api/notifications?userId={id}`

### `/profile/language`
- **Description**: Language settings
- **Status**: Route to be created
- **Backend**: Uses LanguageContext (frontend only)

---

## Notes

1. **Authentication**: All protected routes check for JWT token in localStorage
2. **Error Handling**: All API calls include error handling with fallback to default data
3. **Design**: All pages maintain original design - no changes to UI/UX
4. **API Headers**: Protected routes include `Authorization: Bearer <token>` header
5. **Loading States**: All pages show loading indicators while fetching data
6. **Fallback Data**: Pages use default/mock data if backend is unavailable (for development)

---

## Backend API Endpoints Summary

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login with phone/password
- `POST /api/auth/otp/send` - Send OTP
- `POST /api/auth/otp/verify` - Verify OTP
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile
- `DELETE /api/auth/me` - Delete account

### Venues
- `GET /api/venues` - Get all venues
- `GET /api/venues/top` - Get top venues
- `GET /api/venues/popular` - Get popular venues
- `GET /api/venues/:id` - Get venue by ID

### Services
- `GET /api/services` - Get all services
- `GET /api/services/category/:categoryId` - Get services by category
- `GET /api/services/:id` - Get service by ID

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `PATCH /api/bookings/:id/cancel` - Cancel booking

### Content
- `GET /api/content/privacy` - Get privacy policy
- `GET /api/content/terms` - Get terms and conditions
- `GET /api/content/about` - Get about us

### Settings
- `GET /api/settings` - Get app settings

### Notifications
- `GET /api/notifications` - Get user notifications

---

## Implementation Status

✅ **Completed**:
- All main routes created
- Login/OTP connected to backend
- Booking flow connected to backend
- Venues, Services, Categories connected
- Profile pages connected
- Search functionality connected

🔄 **In Progress**:
- Additional services selection
- Payment card management
- Coupons system

📋 **To Be Implemented**:
- `/profile/coupons` route
- `/profile/notifications` route
- `/profile/language` route
- Support message API endpoint
- Payment cards API endpoint


