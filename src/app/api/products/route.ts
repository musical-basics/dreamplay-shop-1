import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const allProducts = getAllProducts();
    const products = category 
      ? allProducts.filter(p => p.category === category)
      : allProducts;
    
    return NextResponse.json(products);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
