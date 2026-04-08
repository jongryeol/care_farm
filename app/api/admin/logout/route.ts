import { clearSessionCookieOptions } from '@/lib/admin-session'
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(clearSessionCookieOptions())
  return response
}
