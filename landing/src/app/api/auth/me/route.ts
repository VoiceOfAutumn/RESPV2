import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get all cookies from the request
    const cookies = request.headers.get('cookie') || '';
    
    const res = await fetch('https://backend-6wqj.onrender.com/user/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
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
