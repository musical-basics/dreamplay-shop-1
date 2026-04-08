import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getProductBySlug, addImageToProduct } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;

    if (!file || !slug) {
      return NextResponse.json({ error: 'Missing file or slug' }, { status: 400 });
    }

    const product = getProductBySlug(slug);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name).toLowerCase();
    const filename = `upload-${Date.now()}${ext}`;
    const destDir = path.join(process.cwd(), 'public', 'assets', product.category, slug);
    await mkdir(destDir, { recursive: true });
    
    const destPath = path.join(destDir, filename);
    await writeFile(destPath, buffer);

    const url = `/assets/${product.category}/${slug}/${filename}`;
    addImageToProduct(product.id, url);

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
