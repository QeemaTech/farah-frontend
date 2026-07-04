# Multi-Service Booking - Frontend Implementation Guide

## 🎯 Overview

This guide outlines the frontend changes needed to support the new multi-service booking system.

## 📋 Required Changes

### 1. Admin Dashboard - Service Management

#### Update Service Form (`AdminServices.jsx` or similar)

**Add New Fields:**

```jsx
// Service Type Dropdown
<select value={formData.serviceType} onChange={...}>
  <option value="OTHER">Other</option>
  <option value="FOOD_PROVIDER">Food Provider</option>
  <option value="PHOTOGRAPHER">Photographer</option>
  <option value="CAR">Car</option>
  <option value="DECORATION">Decoration</option>
  <option value="DJ">DJ</option>
  <option value="FLORIST">Florist</option>
</select>

// Price Per Hour (optional)
<input 
  type="number" 
  placeholder="Price per hour (optional)"
  value={formData.pricePerHour}
/>

// Capabilities Checkboxes
<label>
  <input 
    type="checkbox" 
    checked={formData.worksInVenues}
  />
  Works in Venues
</label>
<label>
  <input 
    type="checkbox" 
    checked={formData.worksExternal}
  />
  Works at External Locations
</label>
<label>
  <input 
    type="checkbox" 
    checked={formData.requiresVenue}
  />
  Requires Venue
</label>

// Working Hours
<input 
  type="time" 
  placeholder="Start time (e.g., 09:00)"
  value={formData.workingHoursStart}
/>
<input 
  type="time" 
  placeholder="End time (e.g., 22:00)"
  value={formData.workingHoursEnd}
/>

// Full Address
<input 
  type="text" 
  placeholder="Full Address"
  value={formData.address}
/>
<input 
  type="number" 
  step="any"
  placeholder="Latitude"
  value={formData.latitude}
/>
<input 
  type="number" 
  step="any"
  placeholder="Longitude"
  value={formData.longitude}
/>
```

**API Call:**
```javascript
const response = await axios.post('/api/admin/services', {
  ...formData,
  serviceType: formData.serviceType || 'OTHER',
  worksInVenues: formData.worksInVenues ?? true,
  worksExternal: formData.worksExternal ?? true,
  requiresVenue: formData.requiresVenue ?? false,
}, {
  headers: {
    'Content-Type': 'multipart/form-data',
    Authorization: `Bearer ${token}`
  }
});
```

#### Update Services List

**Add Filters:**
```jsx
<select onChange={(e) => setServiceTypeFilter(e.target.value)}>
  <option value="">All Types</option>
  <option value="FOOD_PROVIDER">Food Providers</option>
  <option value="PHOTOGRAPHER">Photographers</option>
  ...
</select>
```

**Display Service Type:**
```jsx
{service.serviceType === 'FOOD_PROVIDER' && '🍽️ Food Provider'}
{service.serviceType === 'PHOTOGRAPHER' && '📷 Photographer'}
```

### 2. Booking Flow Updates

#### New Booking Flow Structure

**Step 1: Booking Type Selection**
```jsx
// NewBookingSteps.jsx or similar
const [bookingType, setBookingType] = useState(null); // 'venue', 'services', 'mixed'

// Initial selection
<button onClick={() => setBookingType('venue')}>
  Book Venue
</button>
<button onClick={() => setBookingType('services')}>
  Book Services Only
</button>
```

**Step 2: Service Selection (if services-only or mixed)**
```jsx
// Filter services by type
const [selectedServiceType, setSelectedServiceType] = useState(null);

<select onChange={(e) => setSelectedServiceType(e.target.value)}>
  <option value="">All Services</option>
  <option value="FOOD_PROVIDER">Food Providers</option>
  <option value="PHOTOGRAPHER">Photographers</option>
</select>

// Show services filtered by type
{services
  .filter(s => !selectedServiceType || s.serviceType === selectedServiceType)
  .map(service => (
    <ServiceCard 
      key={service.id}
      service={service}
      onSelect={() => handleServiceSelect(service)}
    />
  ))}
```

**Step 3: Service Booking Form (for each selected service)**
```jsx
// ServiceBookingForm.jsx (new component)
function ServiceBookingForm({ service, onNext, venueId }) {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    duration: '',
    locationType: venueId ? 'venue' : 'home',
    locationAddress: '',
    latitude: null,
    longitude: null,
    notes: '',
  });

  // Location type options based on service capabilities
  const locationOptions = [];
  if (service.worksInVenues && venueId) {
    locationOptions.push({ value: 'venue', label: 'At Venue' });
  }
  if (service.worksExternal) {
    locationOptions.push(
      { value: 'home', label: 'Home' },
      { value: 'hotel', label: 'Hotel' },
      { value: 'outdoor', label: 'Outdoor' },
      { value: 'other', label: 'Other' }
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="date" 
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
      />
      <input 
        type="time" 
        value={formData.startTime}
        placeholder="Start Time"
      />
      <input 
        type="time" 
        value={formData.endTime}
        placeholder="End Time"
      />
      
      <select 
        value={formData.locationType}
        onChange={(e) => setFormData({...formData, locationType: e.target.value})}
      >
        {locationOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {formData.locationType !== 'venue' && (
        <>
          <input 
            type="text"
            placeholder="Address"
            value={formData.locationAddress}
            required
          />
          {/* Optional: Map picker for coordinates */}
        </>
      )}

      <textarea 
        placeholder="Notes (optional)"
        value={formData.notes}
      />

      <button type="submit">Continue</button>
    </form>
  );
}
```

**Step 4: Booking Summary**
```jsx
// Show booking type
{bookingData.bookingType === 'SERVICES_ONLY' && (
  <div>Services Only Booking</div>
)}

// Show all services with details
{bookingData.services.map((serviceBooking, idx) => (
  <div key={idx}>
    <h3>{serviceBooking.service.name}</h3>
    <p>Date: {serviceBooking.date || bookingData.date}</p>
    <p>Time: {serviceBooking.startTime} - {serviceBooking.endTime}</p>
    <p>Location: {
      serviceBooking.locationType === 'venue' ? 'At Venue' :
      serviceBooking.locationType === 'home' ? 'Home' :
      serviceBooking.locationType === 'hotel' ? 'Hotel' :
      serviceBooking.locationAddress
    }</p>
    <p>Price: ${serviceBooking.price}</p>
  </div>
))}
```

**Step 5: Submit Booking**
```javascript
const bookingPayload = {
  // Venue (optional)
  venueId: bookingData.venueId || null,
  
  // Services array
  services: bookingData.services.map(sb => ({
    serviceId: sb.service.id,
    date: sb.date || bookingData.date,
    startTime: sb.startTime,
    endTime: sb.endTime,
    duration: sb.duration,
    locationType: sb.locationType,
    locationAddress: sb.locationType !== 'venue' ? sb.locationAddress : null,
    locationLatitude: sb.locationLatitude,
    locationLongitude: sb.locationLongitude,
    notes: sb.notes,
    price: sb.price,
  })),
  
  // Main booking details
  date: bookingData.date,
  startTime: bookingData.startTime,
  endTime: bookingData.endTime,
  totalAmount: calculateTotal(),
  cardId: selectedCard?.id,
};

await axios.post('/api/mobile/bookings', bookingPayload, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 3. Service Availability Checking

```javascript
// Before allowing booking, check availability
const checkAvailability = async (serviceId, date, startTime, endTime) => {
  try {
    const response = await axios.get(
      `/api/mobile/services/${serviceId}/availability`,
      {
        params: { date, startTime, endTime }
      }
    );
    
    if (!response.data.available) {
      alert(response.data.reason || 'Service is not available');
      return false;
    }
    return true;
  } catch (error) {
    // Handle error
    return false;
  }
};
```

### 4. Booking Details View Updates

```jsx
// BookingDetails.jsx
<div>
  <h2>Booking Type: {
    booking.bookingType === 'VENUE_ONLY' ? 'Venue Only' :
    booking.bookingType === 'SERVICES_ONLY' ? 'Services Only' :
    'Mixed (Venue + Services)'
  }</h2>

  {booking.venue && (
    <div>
      <h3>Venue</h3>
      <p>{booking.venue.nameAr}</p>
      <p>Date: {booking.date}</p>
      <p>Time: {booking.startTime} - {booking.endTime}</p>
    </div>
  )}

  {booking.services && booking.services.length > 0 && (
    <div>
      <h3>Services</h3>
      {booking.services.map((bs, idx) => (
        <div key={idx}>
          <h4>{bs.service.nameAr}</h4>
          <p>Date: {bs.date || booking.date}</p>
          <p>Time: {bs.startTime} - {bs.endTime}</p>
          <p>Location: {
            bs.locationType === 'venue' ? 'At Venue' :
            bs.locationType === 'home' ? 'Home' :
            bs.locationType === 'hotel' ? 'Hotel' :
            bs.locationAddress
          }</p>
          <p>Price: ${bs.price}</p>
          {bs.notes && <p>Notes: {bs.notes}</p>}
        </div>
      ))}
    </div>
  )}
</div>
```

## 🔧 Component Structure Recommendations

### New Components Needed:

1. **`ServiceTypeSelector.jsx`**
   - Dropdown for selecting service type
   - Used in service creation and filtering

2. **`ServiceBookingForm.jsx`**
   - Form for booking a single service
   - Handles date, time, location selection
   - Reusable for each service in a booking

3. **`ServiceLocationPicker.jsx`**
   - Location type selector
   - Address input for external locations
   - Map picker (optional)

4. **`ServiceAvailabilityChecker.jsx`**
   - Checks availability before booking
   - Shows availability status

### Updated Components:

1. **`NewBookingSteps.jsx`**
   - Add booking type selection
   - Add service selection step
   - Add service booking forms

2. **`BookingConfirmation.jsx`**
   - Display all services with locations
   - Show booking type

3. **`AdminServices.jsx`**
   - Add new service fields
   - Add service type filter
   - Add holiday management

## 📊 State Management

```javascript
// Booking state structure
const [bookingData, setBookingData] = useState({
  bookingType: null, // 'venue', 'services', 'mixed'
  venueId: null,
  venue: null,
  date: null,
  startTime: null,
  endTime: null,
  services: [ // Array of service bookings
    {
      service: { id, name, nameAr, ... },
      date: null, // Optional, uses booking date if null
      startTime: null,
      endTime: null,
      duration: null,
      locationType: 'venue', // 'venue', 'home', 'hotel', 'outdoor', 'other'
      locationAddress: null,
      locationLatitude: null,
      locationLongitude: null,
      notes: null,
      price: 0,
    }
  ],
  totalAmount: 0,
  discount: 0,
});
```

## 🎨 UI/UX Recommendations

1. **Service Type Icons:**
   - Food Provider: 🍽️
   - Photographer: 📷
   - Car: 🚗
   - Decoration: 🎨
   - DJ: 🎵
   - Florist: 🌸

2. **Location Type Icons:**
   - Venue: 🏛️
   - Home: 🏠
   - Hotel: 🏨
   - Outdoor: 🌳
   - Other: 📍

3. **Visual Flow:**
   - Clear step indicators
   - Progress bar showing booking completion
   - Summary before final confirmation

## ✅ Testing Checklist

- [ ] Create Food Provider service via admin
- [ ] Create Photographer service via admin
- [ ] Filter services by type
- [ ] Book service only (no venue)
- [ ] Book venue + services
- [ ] Book service at external location
- [ ] Check service availability
- [ ] View booking details with all services
- [ ] Admin holiday management

















