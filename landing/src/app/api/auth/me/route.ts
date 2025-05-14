import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {    const res = await fetch('http://localhost:3000/user/me', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!res.ok) {
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }

    const data = await res.json();
    return NextResponse.json({ isLoggedIn: true, user: data });
  } catch (error) {
    return NextResponse.json({ isLoggedIn: false }, { status: 500 });
  }
}
