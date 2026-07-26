import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth/customer';
import { listCustomerPointTransactions } from '@/lib/db/loyalty-points';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    const transactions = await listCustomerPointTransactions(
      session.customer.id,
      20,
    );

    return NextResponse.json({
      authenticated: true,
      customer: {
        id: session.customer.id,
        email: session.customer.email,
        fullName: session.customer.fullName,
        phone: session.customer.phone,
        defaultCity: session.customer.defaultCity,
        defaultAddress: session.customer.defaultAddress,
        pointsBalance: session.customer.pointsBalance,
        pointsPendingBalance: session.customer.pointsPendingBalance,
        firstOrderBonusGranted: session.customer.firstOrderBonusGranted,
      },
      recentTransactions: transactions,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}
