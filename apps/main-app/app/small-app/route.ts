import { readFileSync } from 'fs';
import { join } from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const indexPath = join(process.cwd(), 'public', 'small-app', 'index.html');
  
  try {
    const file = readFileSync(indexPath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    return new NextResponse('Not Found', { status: 404 });
  }
}

