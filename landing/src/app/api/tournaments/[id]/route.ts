import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_INTERNAL_URL } from '@/lib/api';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authorization = request.headers.get('authorization') || '';
    const cookies = request.headers.get('cookie') || '';
    const body = await request.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    if (authorization) {
      headers['Authorization'] = authorization;
    }

    const res = await fetch(`${BACKEND_INTERNAL_URL}/tournaments/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Tournament edit API route error:', error);
    return NextResponse.json({ message: 'Failed to edit tournament' }, { status: 500 });
  }
}
