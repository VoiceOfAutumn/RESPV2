import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_INTERNAL_URL } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    // Get all cookies from the request
    const cookies = request.headers.get('cookie') || '';
    
    // Get authorization header for token-based auth
    const authorization = request.headers.get('authorization') || '';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add cookies if they exist
    if (cookies) {
      headers['Cookie'] = cookies;
    }
    
    // Add authorization header if it exists
    if (authorization) {
      headers['Authorization'] = authorization;
    }
    
    console.log('API route forwarding headers:', headers);
    
    const res = await fetch(`${BACKEND_INTERNAL_URL}/user/me`, {
      method: 'GET',
      headers
    });

    if (!res.ok) {
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json({ 
      isLoggedIn: true, 
      user: {
        displayName: data.displayName,
        profile_picture: data.profile_picture,
        role: data.role
      }
    });
  } catch (error) {
    console.error('Auth API route error:', error);
    return NextResponse.json({ isLoggedIn: false }, { status: 500 });
  }
}
