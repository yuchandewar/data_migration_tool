import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        sourceConnection: true,
        destConnection: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const job = await prisma.job.create({
      data: {
        name: data.name,
        sourceConnectionId: data.sourceConnectionId,
        destConnectionId: data.destConnectionId,
        sourceDatasetName: data.sourceDatasetName,
        destDatasetName: data.destDatasetName,
        transformationRules: JSON.stringify(data.transformationRules || []),
        status: 'PENDING'
      }
    });
    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
