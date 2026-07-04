import { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState(() => {
    // Initialize from sessionStorage if available
    try {
      const saved = sessionStorage.getItem('bookingData_backup');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
    }
    return {};
  });

  // Save to sessionStorage whenever booking data changes
  useEffect(() => {
    if (bookingData && Object.keys(bookingData).length > 0) {
      try {
        sessionStorage.setItem('bookingData_backup', JSON.stringify(bookingData));
      } catch (error) {
        console.error('Error saving booking data:', error);
      }
    }
  }, [bookingData]);

  const updateBookingData = (updates) => {
    setBookingData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const clearBookingData = () => {
    setBookingData({});
    try {
      sessionStorage.removeItem('bookingData_backup');
    } catch (error) {
      console.error('Error clearing booking data:', error);
    }
  };

  const value = {
    bookingData,
    setBookingData,
    updateBookingData,
    clearBookingData
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export default BookingContext;
