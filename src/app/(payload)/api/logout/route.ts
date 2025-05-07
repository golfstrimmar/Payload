import { NextResponse } from 'next/server'

export async function POST() {
  // Удаляем куки payload-token
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.set('payload-token', '', { maxAge: -1 }) // Удаляем куки
  return response
}
