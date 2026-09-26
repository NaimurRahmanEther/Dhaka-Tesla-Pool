import { useState } from 'react'

import { Alert, Badge, Button, Card, EmptyState, PageHeader, Spinner } from '@/components/ui'
import useApi from '@/hooks/useApi'
import { formatDateTime, formatTaka } from '@/lib/format'
import { RIDE_STATUS, PAYMENT_METHODS } from '@/lib/constants'
import rideService from '@/services/ride.service'
import paymentService from '@/services/payment.service'

// Passenger payments page. Two sections:
// 1. Rides ready to pay (COMPLETED, no payment yet) — each shows a Pay button.
// 2. Payment history — all past payments with method, amount, date.
//
// The backend enforces: only COMPLETED rides can be paid, one payment per ride.
// A payment row includes the ride's pickup/destination for context.

export default function PaymentsPage() {
  const {
    data: myRides,
    loading: ridesLoading,
    error: ridesError,
    reload: reloadRides,
  } = useApi(() => rideService.getMyRides(), [])

  const {
    data: myPayments,
    loading: paymentsLoading,
    error: paymentsError,
    reload: reloadPayments,
  } = useApi(() => paymentService.getMyPayments(), [])

  const [payingRideId, setPayingRideId] = useState(null)
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS.CASH)
  const [payError, setPayError] = useState(null)
  const [paySuccess, setPaySuccess] = useState(false)

  // Rides that are COMPLETED but not yet paid (no matching payment with status PAID)
  const paidRideIds = new Set(
    (myPayments?.data || [])
      .filter((p) => p.status === 'PAID')
      .map((p) => p.ride_id)
  )

  const ridesToPay = (myRides?.data || []).filter(
    (r) => r.status === RIDE_STATUS.COMPLETED && !paidRideIds.has(r.id)
  )

  async function handlePay(rideId) {
    setPayingRideId(rideId)
    setPayError(null)

    try {
      await paymentService.payForRide(rideId, payMethod)
      setPaySuccess(true)
      reloadRides()
      reloadPayments()
    } catch (err) {
      setPayError(err.message)
    } finally {
      setPayingRideId(null)
    }
  }

  if (ridesLoading || paymentsLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (ridesError || paymentsError) {
    return (
      <>
        <PageHeader title="Payments" description="Pay for completed rides and view your payment history." />
        <div className="mt-8 max-w-md">
          <Alert tone="error">{ridesError?.message || paymentsError?.message}</Alert>
          <Button className="mt-4" onClick={() => { reloadRides(); reloadPayments(); }}>
            Try again
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Payments"
        description="Pay for completed rides and view your payment history."
      />

      {paySuccess && (
        <Card className="mt-6 border-emerald-200">
          <p className="text-sm text-slate-600">Payment successful.</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => setPaySuccess(false)}>
            OK
          </Button>
        </Card>
      )}

      {payError && (
        <div className="mt-6 max-w-md">
          <Alert tone="error">{payError}</Alert>
        </div>
      )}

      {/* Section 1: Rides ready to pay */}
      <Card className="mt-6">
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Rides to pay</h3>

        {ridesToPay.length === 0 ? (
          <EmptyState
            description="No completed rides awaiting payment. When a trip finishes, it will appear here."
          />
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {ridesToPay.map((ride) => (
              <li key={ride.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Ride #{ride.id} — {ride.pickup_location} → {ride.destination_location}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Completed {formatDateTime(ride.completed_at)} · {ride.seats_requested} seat{ride.seats_requested > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{formatTaka(ride.fare)} BDT</span>
                  <Badge status={ride.status} />
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    disabled={payingRideId !== null}
                    className="border border-slate-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value={PAYMENT_METHODS.CASH}>Cash</option>
                    <option value={PAYMENT_METHODS.TESLA_WALLET}>Tesla Wallet</option>
                  </select>
                  <Button
                    size="sm"
                    loading={payingRideId === ride.id}
                    disabled={payingRideId !== null && payingRideId !== ride.id}
                    onClick={() => handlePay(ride.id)}
                  >
                    Pay
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Section 2: Payment history */}
      <Card className="mt-6">
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Payment history</h3>

        const history = myPayments?.data || []

        {history.length === 0 ? (
          <EmptyState
            description="No payments yet. Completed rides will appear here after you pay."
          />
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {history.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Ride #{payment.ride_id} — {payment.pickup_location} → {payment.destination_location}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime(payment.created_at)} · {payment.method}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{formatTaka(payment.amount)} BDT</span>
                  <Badge status={payment.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}