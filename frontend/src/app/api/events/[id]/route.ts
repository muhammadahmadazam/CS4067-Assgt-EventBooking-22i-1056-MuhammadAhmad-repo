import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// interface Context {
//   params: {
//     id: string;
//   };
// }

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> })  {
  const token = request.headers.get('Authorization');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    
    const response = await fetch(`${BACKEND_URL}/api/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete event');
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }// Ensuring correct parameter typing
) {
  const token = request.headers.get('Authorization');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const body = await request.json(); // Get the updated event data
    
    const response = await fetch(`${BACKEND_URL}/api/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(body) // Send the updated event data to Spring Boot
    });
    
    if (!response.ok) {
      throw new Error('Failed to update event');
    }
    
    const data = await response.json(); // Get the updated event from Spring Boot
    return NextResponse.json(data, { status: 200 }); // Return the updated event to the frontend
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}