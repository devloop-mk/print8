import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth/customer';
import { customersDb } from '@/lib/db/customers';
import { listCustomerPointTransactions } from '@/lib/db/loyalty-points';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [orders, transactions] = await Promise.all([
      customersDb.listOrders(session.customer.id),
      listCustomerPointTransactions(session.customer.id, 100),
    ]);

    return NextResponse.json({ orders, transactions });
  } catch {
    return NextResponse.json({ error: 'Failed to load account data' }, { status: 500 });
  }
}
