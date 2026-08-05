import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Services from './pages/Services'
import Venues from './pages/Venues'
import VenueDetails from './pages/VenueDetails'
import ServiceDetails from './pages/ServiceDetails'
import Booking from './pages/Booking'
import BookingDetails from './pages/BookingDetails'
import NewBookingSteps from './pages/NewBookingSteps'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Coupons from './pages/Coupons'
import TechnicalSupport from './pages/TechnicalSupport'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsConditions from './pages/TermsConditions'
import Search from './pages/Search'
import BookingConfirmation from './pages/BookingConfirmation'
import BookingSuccess from './pages/BookingSuccess'
import AddBooking from './pages/AddBooking'
import CreateAccount from './pages/CreateAccount'
import BookAppointment from './pages/BookAppointment'
import AdditionalServices from './pages/AdditionalServices'
import BookingLocation from './pages/BookingLocation'
import MyServices from './pages/MyServices'
import Wallet from './pages/Wallet'
import SelectServices from './pages/SelectServices'
import CustomizeVenue from './pages/CustomizeVenue'
import AddCard from './pages/AddCard'
import ServiceBooking from './pages/ServiceBooking'
import Login from './pages/Login'
import Register from './pages/Register'
import OTP from './pages/OTP'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Payment from './pages/Payment'
import Onboarding from './pages/Onboarding'
import SplashScreen from './pages/SplashScreen'
import LocationPermission from './pages/LocationPermission'
import Notifications from './pages/Notifications'
import SlaughterCalculator from './pages/SlaughterCalculator'
import SlaughterResult from './pages/SlaughterResult'
import SlaughterOrder from './pages/SlaughterOrder'
import OnboardingGuard from './components/OnboardingGuard'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import PageLoader from './components/PageLoader'
import AdminApp from './admin/AdminApp'
import './App.css'

function AppRoutes() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <PageLoader />
      <OnboardingGuard>
        <Routes>
          {/* Splash Screen - First thing to show */}
          <Route 
            path="/splash" 
            element={<SplashScreen />} 
          />
          {/* Public Routes - Only accessible when NOT authenticated */}
          <Route 
            path="/onboarding" 
            element={
              <PublicRoute>
                <Onboarding />
              </PublicRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />
          <Route 
            path="/otp" 
            element={
              <PublicRoute>
                <OTP />
              </PublicRoute>
            } 
          />
          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } 
          />
          
          {/* Location Permission - Protected route, shown after login */}
          <Route 
            path="/location-permission" 
            element={
              <ProtectedRoute>
                <LocationPermission />
              </ProtectedRoute>
            } 
          />
          
          {/* Root — mobile entry; OnboardingGuard / auth decide next step */}
          <Route
            path="/"
            element={<Navigate to="/splash" replace />}
          />
          
          {/* Home route - Protected */}
          <Route
            path="/add-card"
            element={
              <ProtectedRoute>
                <AddCard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          {/* Vendor portal (PROVIDER) — same AdminApp shell, /provider/* URLs */}
          <Route path="/provider/*" element={<AdminApp />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues"
          element={
            <ProtectedRoute>
              <Venues />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venue/:id"
          element={
            <ProtectedRoute>
              <VenueDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/:id"
          element={
            <ProtectedRoute>
              <ServiceDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking"
          element={
            <ProtectedRoute>
              <Booking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/:id"
          element={
            <ProtectedRoute>
              <BookingDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/new"
          element={
            <ProtectedRoute>
              <NewBookingSteps />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/service"
          element={
            <ProtectedRoute>
              <ServiceBooking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/add"
          element={
            <ProtectedRoute>
              <AddBooking />
            </ProtectedRoute>
          }
        />
        
        {/* Slaughter Calculator Routes */}
        <Route
          path="/slaughter"
          element={
            <ProtectedRoute>
              <SlaughterCalculator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/slaughter/result"
          element={
            <ProtectedRoute>
              <SlaughterResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/slaughter/order"
          element={
            <ProtectedRoute>
              <SlaughterOrder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/coupons"
          element={
            <ProtectedRoute>
              <Coupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <TechnicalSupport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={<PrivacyPolicy />}
        />
        <Route
          path="/terms"
          element={<TermsConditions />}
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-confirmation"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking/success"
          element={
            <ProtectedRoute>
              <BookingSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-card"
          element={
            <ProtectedRoute>
              <AddCard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-account"
          element={
            <ProtectedRoute>
              <CreateAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-appointment"
          element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/additional-services"
          element={
            <ProtectedRoute>
              <AdditionalServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-location"
          element={
            <ProtectedRoute>
              <BookingLocation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-services"
          element={
            <ProtectedRoute>
              <MyServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/select-services"
          element={
            <ProtectedRoute>
              <SelectServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customize-venue"
          element={
            <ProtectedRoute>
              <CustomizeVenue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-card"
          element={
            <ProtectedRoute>
              <AddCard />
            </ProtectedRoute>
          }
        />
        
        {/* Admin / vendor portal */}
        <Route path="/admin/*" element={<AdminApp />} />
        
          {/* Catch all — fall back to splash entry */}
          <Route
            path="*"
            element={<Navigate to="/splash" replace />}
          />
        </Routes>
      </OnboardingGuard>
    </Router>
  )
}

function App() {
  return <AppRoutes />
}

export default App

