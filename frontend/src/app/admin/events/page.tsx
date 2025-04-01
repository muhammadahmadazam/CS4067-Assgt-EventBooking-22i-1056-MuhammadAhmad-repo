'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash } from 'react-icons/fa'; // For dustbin icon
import { AiOutlineEdit } from 'react-icons/ai'; // For edit icon
import { useAuth } from '@/contexts/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  seats: number; // Total seats (treated as remaining for now)
}

export default function AdminEventsPage() {
    const {logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Omit<Event, 'id'>>({
    title: '',
    description: '',
    date: '',
    seats: 0, // Added seats to the form data
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null); // For editing
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token') || getCookie('token');
    if (!token) {
      router.push('/login');
    } else {
      fetchEvents();
    }
  }, [router]);

  // Get cookie helper function
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Fetch all events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || getCookie('token');
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'seats' ? parseInt(value) || 0 : value,
    });
  };

  // Create a new event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token') || getCookie('token');
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      // Reset form and close modal
      setFormData({ title: '', description: '', date: '', seats: 0 });
      setShowModal(false);
      
      // Refresh events list
      fetchEvents();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  // Update an event
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent) return;
    
    try {
      const token = localStorage.getItem('token') || getCookie('token');
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      
      // Close modal and refresh events list
      setShowEditModal(false);
      setSelectedEvent(null);
      setFormData({ title: '', description: '', date: '', seats: 0 });
      fetchEvents();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  // Delete an event
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || getCookie('token');
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      
      // Refresh events list
      fetchEvents();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  // Open edit modal and populate form with event data
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      seats: event.seats,
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, Muhammad Ahmad</span>
            <button 
              onClick={logout} // Assuming logout redirects to login
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Create New Event
                </button>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              {events.length === 0 ? (
                <p className="text-gray-500 text-center">No upcoming events found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Seats</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {events.map((event) => (
                        <tr key={event.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {event.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(event.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                            {event.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.seats}  {/* Displaying total seats as remaining for now */}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="text-blue-600 hover:text-blue-900 mr-2"
                              title="Update"
                            >
                              <AiOutlineEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FaTrash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create New Event</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateEvent}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="seats">
                  Remaining Seats
                </label>
                <input
                  id="seats"
                  name="seats"
                  type="number"
                  value={formData.seats}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Event</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEvent(null);
                  setFormData({ title: '', description: '', date: '', seats: 0 });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateEvent}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="seats">
                  Remaining Seats
                </label>
                <input
                  id="seats"
                  name="seats"
                  type="number"
                  value={formData.seats}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    setFormData({ title: '', description: '', date: '', seats: 0 });
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  Update Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}