import { Link, useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthStore();

  const isOrganizerOrAdmin =
    user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'organizer';

  const isAttendanceMode = !!eventId && location.pathname.includes('/attendance');

  const showMyTickets = !isOrganizerOrAdmin;

  // We only show these if we are NOT in attendance mode
  const mainNavItems = !isAttendanceMode
    ? [
        { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
        { name: 'My Events', icon: 'calendar_today', path: '/dashboard/events' },
      ]
    : [];

  if (!isOrganizerOrAdmin && !isAttendanceMode) {
    mainNavItems.push({ name: 'Join Event Calls', icon: 'video_chat', path: '/tickets/calls' });
  }

  if (isOrganizerOrAdmin && !isAttendanceMode) {
    mainNavItems.push({
      name: 'Manage Events',
      icon: 'edit_calendar',
      path: '/dashboard/events/manage',
    });
    mainNavItems.push({ name: 'Attendance', icon: 'qr_code_scanner', path: '/attendance' });
    
    // Admin specific link
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      mainNavItems.push({
        name: 'Platform Analytics',
        icon: 'analytics',
        path: '/admin/analytics',
      });
    }
  }

  if (showMyTickets && !isAttendanceMode) {
    mainNavItems.push({ name: 'My Tickets', icon: 'confirmation_number', path: '/tickets/my' });
  }

  // Attendance specific items - Simplified to a single link as per request
  const attendanceItems = isAttendanceMode
    ? [{ name: 'Check-in List', icon: 'qr_code_scanner', path: `/events/${eventId}/attendance` }]
    : [];

  return (
    <aside className="w-[240px] shrink-0 bg-background border-r border-border flex flex-col h-[calc(100vh-64px)] sticky top-16 z-30">
      <nav className="flex-1 px-4 space-y-1 mt-6">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}

        {isAttendanceMode && (
          <div className="space-y-1">
            {attendanceItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}

            {/* Added a Back button for usability, even if simplified */}
            <Link
              to="/dashboard/events"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-4"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="text-sm font-medium">Back to Events</span>
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
