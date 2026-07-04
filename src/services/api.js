import axios from 'axios';

// API base URL — /api uses Vite dev proxy to backend (port 8001)
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),

    sendOTP: (phone) => apiClient.post('/auth/otp/send', { phone }),
    verifyOTP: (phone, otp) => apiClient.post('/auth/otp/verify', { phone, otp }),

    // Password Reset
    forgotPassword: (phone) => apiClient.post('/auth/forgot-password', { phone }),
    resetPassword: (phone, otp, newPassword) =>
        apiClient.post('/auth/reset-password', { phone, otp, newPassword }),

    getMe: () => apiClient.get('/auth/me'),
    updateProfile: (data) => apiClient.patch('/auth/me', data),
    deleteAccount: () => apiClient.delete('/auth/me'),
};

// Payment API
export const paymentAPI = {
    createPaymentIntent: (bookingId, amount) =>
        apiClient.post('/payments/create-intent', { bookingId, amount }),

    confirmPayment: (paymentIntentId, bookingId) =>
        apiClient.post('/payments/confirm', { paymentIntentId, bookingId }),

    requestRefund: (bookingId, amount) =>
        apiClient.post('/payments/refund', { bookingId, amount }),
};

// Vendor marketplace API (venue / event providers) — unified under /api/mobile/vendor
export const providerAPI = {
    getDashboardStats: () => apiClient.get('/mobile/vendor/dashboard'),

    getVenues: (params) => apiClient.get('/mobile/vendor/venues', { params }),
    updateVenue: (id, data) => apiClient.patch(`/mobile/vendor/venues/${id}`, data),

    getServices: (params) => apiClient.get('/mobile/vendor/services', { params }),
    updateService: (id, data) => apiClient.patch(`/mobile/vendor/services/${id}`, data),

    getBookings: (params) => apiClient.get('/mobile/vendor/bookings', { params }),

    getEarnings: (params) => apiClient.get('/mobile/vendor/earnings', { params }),
};

// Mobile API (existing endpoints)
export const mobileAPI = {
    getHome: (params) => apiClient.get('/mobile/home', { params }),

    getVenues: (params) => apiClient.get('/mobile/venues', { params }),
    getVenueDetails: (id) => apiClient.get(`/mobile/venues/${id}`),
    toggleFavoriteVenue: (id, isFavorite) =>
        isFavorite
            ? apiClient.delete(`/mobile/venues/${id}/favorite`)
            : apiClient.post(`/mobile/venues/${id}/favorite`),

    getServices: (params) => apiClient.get('/mobile/services', { params }),
    getServiceDetails: (id) => apiClient.get(`/mobile/services/${id}`),
    // Create service-only booking (supports multiple services without venue)
    createServiceBooking: (data) => apiClient.post('/mobile/services/booking', data),

    getCategories: () => apiClient.get('/mobile/categories'),

    getBookings: (params) => apiClient.get('/mobile/bookings', { params }),
    getBookingDetails: (id) => apiClient.get(`/mobile/bookings/${id}`),
    createBooking: (data) => apiClient.post('/bookings', data),
    cancelBooking: (id) => apiClient.patch(`/bookings/${id}/cancel`),

    getProfile: () => apiClient.get('/mobile/profile'),
    updateProfile: (data) => apiClient.patch('/mobile/profile', data),
    deleteProfile: () => apiClient.delete('/mobile/profile'),

    getNotifications: (params) => apiClient.get('/mobile/notifications', { params }),
    markNotificationAsRead: (id) => apiClient.patch(`/mobile/notifications/${id}/read`),

    getCoupons: (params) => apiClient.get('/mobile/coupons', { params }),

    getSettings: () => apiClient.get('/mobile/settings'),

    getPrivacyPolicy: () => apiClient.get('/mobile/content/privacy'),
    getTermsConditions: () => apiClient.get('/mobile/content/terms'),
    getAboutUs: () => apiClient.get('/mobile/content/about'),

    search: (params) => apiClient.get('/mobile/search', { params }),
};

export { API_URL, apiClient };
export default apiClient;
