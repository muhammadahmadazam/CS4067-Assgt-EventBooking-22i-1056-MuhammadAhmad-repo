import { NextRequest, NextResponse } from 'next/server';

const EVENT_SERVICE_URL = process.env.EVENT_SERVICE_URL || 'http://localhost:8080';

export async function GET() {
  try {
    // Fetch events from Spring Boot without requiring a token (publicly available)
    const response = await fetch(`${EVENT_SERVICE_URL}/api/events`, {
      headers: {
        'Cache-Control': 'no-cache', // Optional: Prevent caching if needed
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    const response = await fetch(`${EVENT_SERVICE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(body) // Includes title, description, date, and seats
    });
    
    if (!response.ok) {
      throw new Error('Failed to create event');
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}