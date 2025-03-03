'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  seats: number; // Total seats (treated as remaining for now)
}

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null); // Track booking loading state for specific event
  const router = useRouter();

  useEffect(() => {
    // Fetch events from the event service (publicly available, no token needed)
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events', { // No token required
          headers: {
            'Cache-Control': 'no-cache', // Optional: Prevent caching if needed
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data);
      } catch (error: any) {
        setError(error.message);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents(); // Fetch events regardless of user login status
  }, []);

  // Handle booking an event
  const handleBookEvent = async (eventId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    if (user.role === 'admin') {
      // No action for admins
      alert('Admins cannot book events.');
      return;
    }

    if (user.role === 'user') {
      setBookingLoading(eventId); // Show loading for this specific event
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/events/${eventId}/book`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }), // Assuming user has an ID
        });

        if (!response.ok) {
          throw new Error('Failed to book event');
        }

        const data = await response.json();
        alert(`Event ${eventId} booked successfully for ${user.first_name} ${user.last_name}!`);
        // Optionally, refetch events to update remaining seats
        await fetchEvents();
      } catch (error: any) {
        setError(error.message);
      } finally {
        setBookingLoading(null); // Hide loading
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-900">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          {user && ( // Only show welcome and logout if user is logged in
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.first_name} {user?.last_name}</span>
              <button
                onClick={logout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Upcoming Events</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {eventsLoading ? (
                <p className="text-gray-500">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-gray-500">No upcoming events found.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                        <p className="text-gray-600 mt-2">{new Date(event.date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="mt-2 text-gray-700 truncate max-h-12">{event.description}</p>
                        <p className="mt-2 text-gray-700">Remaining Seats: {event.seats}</p>
                        <div className="mt-4">
                          {bookingLoading === event.id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                              <span className="ml-2 text-gray-700">Booking...</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBookEvent(event.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Book Event
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}