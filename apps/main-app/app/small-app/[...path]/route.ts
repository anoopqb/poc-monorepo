import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  const pathSegments = params.path || [];
  const filePath = pathSegments.length === 0 ? 'index.html' : pathSegments.join('/');
  
  const publicPath = join(process.cwd(), 'public', 'small-app', filePath);
  
  try {
    const file = readFileSync(publicPath);
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    const contentType = 
      ext === 'html' ? 'text/html' :
      ext === 'js' ? 'application/javascript' :
      ext === 'css' ? 'text/css' :
      ext === 'json' ? 'application/json' :
      ext === 'png' ? 'image/png' :
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
      ext === 'svg' ? 'image/svg+xml' :
      ext === 'ico' ? 'image/x-icon' :
      'application/octet-stream';
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    if (filePath === 'index.html' || !filePath.endsWith('.html')) {
      const indexPath = join(process.cwd(), 'public', 'small-app', 'index.html');
      try {
        const indexFile = readFileSync(indexPath);
        return new NextResponse(indexFile, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      } catch {
        return new NextResponse('Not Found', { status: 404 });
      }
    }
    return new NextResponse('Not Found', { status: 404 });
  }
}

