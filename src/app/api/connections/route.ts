import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const connections = await prisma.connection.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(connections);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const connection = await prisma.connection.create({
      data: {
        name: data.name,
        type: data.type,
        config: JSON.stringify(data.config)
      }
    });
    return NextResponse.json(connection, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
