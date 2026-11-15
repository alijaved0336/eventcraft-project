import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layouts/RootLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import RegisterPage from '@/features/auth/pages/RegisterPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import OAuthCallbackPage from '@/features/auth/pages/OAuthCallbackPage';
import IndexPage from '@/pages/IndexPage';
import DiscoverEventsPage from '@/pages/DiscoverEventsPage';
import CreateEventPage from '@/features/events/pages/CreateEventPage';
import EditEventPage from '@/features/events/pages/EditEventPage';
import EventListingPage from '@/features/events/pages/EventListingPage';
import EventDetailPage from '@/features/events/pages/EventDetailPage';
import ManageEventsPage from '@/features/events/pages/ManageEventsPage';
import CheckoutPage from '@/features/tickets/pages/CheckoutPage';
import SuccessPage from '@/features/tickets/pages/SuccessPage';
import MyTicketsPage from '@/features/tickets/pages/MyTicketsPage';
import TicketDetailsPage from '@/features/tickets/pages/TicketDetailsPage';
import JoinCallsPage from '@/features/tickets/pages/JoinCallsPage';
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AttendanceManagementPage from '@/features/events/pages/attendance/AttendanceManagementPage';
import AttendanceListingPage from '@/features/events/pages/attendance/AttendanceListingPage';
import EventPerformanceAnalyticsPage from '@/features/analytics/pages/EventPerformanceAnalyticsPage';
import StaffCheckInPage from '@/features/checkin/pages/StaffCheckInPage';
import LivestreamDashboard from '@/features/livestream/pages/LivestreamDashboard';
import AttendeeLivestreamPage from '@/features/livestream/pages/AttendeeLivestreamPage';
import AdminAnalyticsPage from '@/features/analytics/pages/AdminAnalyticsPage';
import RoleProtectedRoute from '@/components/auth/RoleProtectedRoute';
import OrganizerLandingPage from '@/pages/OrganizerLandingPage';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        {
          path: 'auth',
          element: <AuthLayout />,
          children: [
            {
              path: 'register',
              element: <RegisterPage />,
            },
            {
              path: 'login',
              element: <LoginPage />,
            },
            {
              path: 'callback',
              element: <OAuthCallbackPage />,
            },
          ],
        },
        {
          path: '',
          element: <IndexPage />,
        },
        {
          path: 'dashboard',
          element: (
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events',
          element: <DiscoverEventsPage />,
        },
        {
          path: 'organizer',
          element: <OrganizerLandingPage />,
        },
        {
          path: 'dashboard/events',
          element: (
            <ProtectedRoute>
              <EventListingPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'dashboard/events/manage',
          element: (
            <ProtectedRoute>
              <ManageEventsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'admin/analytics',
          element: (
            <RoleProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminAnalyticsPage />
            </RoleProtectedRoute>
          ),
        },
        {
          path: 'attendance',
          element: (
            <ProtectedRoute>
              <AttendanceListingPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events/create',
          element: (
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events/edit/:id',
          element: (
            <ProtectedRoute>
              <EditEventPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events/:id',
          element: <EventDetailPage />,
        },
        {
          path: 'events/:eventId/attendance',
          element: (
            <ProtectedRoute>
              <AttendanceManagementPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events/:eventId/studio',
          element: (
            <ProtectedRoute>
              <LivestreamDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events/:eventId/live/:issuanceId',
          element: (
            <ProtectedRoute>
              <AttendeeLivestreamPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events/:eventId/analytics',
          element: (
            <ProtectedRoute>
              <EventPerformanceAnalyticsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events/:eventId/checkin',
          element: (
            <ProtectedRoute>
              <StaffCheckInPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'events/:eventId/checkout',
          element: (
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'orders/success/:orderId',
          element: (
            <ProtectedRoute>
              <SuccessPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'tickets',
          children: [
            {
              path: 'my',
              element: (
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              ),
            },
            {
              path: 'calls',
              element: (
                <ProtectedRoute>
                  <JoinCallsPage />
                </ProtectedRoute>
              ),
            },
            {
              path: 'pass/:ticketId',
              element: (
                <ProtectedRoute>
                  <TicketDetailsPage />
                </ProtectedRoute>
              ),
            },
          ],
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
