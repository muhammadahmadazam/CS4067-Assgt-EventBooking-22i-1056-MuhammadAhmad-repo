// types/event.ts
export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    imageUrl?: string;
    location?: string;
    capacity?: number;
    registered?: number;
    price?: number;
    category?: string;
  }
  
  export interface BookingResponse {
    success: boolean;
    message: string;
    bookingId?: string;
    eventId?: string;
    userId?: string;
    bookingDate?: string;
  }
  
  export interface ApiError {
    message: string;
    status?: number;
    code?: string;
  }