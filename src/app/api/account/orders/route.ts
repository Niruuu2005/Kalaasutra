import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { OrderService } from '@/lib/services/order.service';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: { message: 'Authentication required.' } }, { status: 401 });
    }

    const orders = await OrderService.getOrdersByUser(user.id);
    return NextResponse.json({ success: true, data: { orders } }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to load orders.';
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
