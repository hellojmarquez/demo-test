import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function validateAdmin(req: NextRequest) {
  const cookie = req.cookies.get('admin');
  if (!cookie) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(cookie.value.toString(), JWT_SECRET) as unknown as { role: string };
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden access' }, { status: 403 });
    }
    return null;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
