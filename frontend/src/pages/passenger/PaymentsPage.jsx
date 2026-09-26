import { useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  PageHeader,
  Select,
  Spinner,
} from '@/components/ui'
import useApi from '@/hooks/useApi'
import { formatDateTime, formatTaka } from '@/lib/format'
import { RIDE_STATUS, PAYMENT_METHODS } from '@/lib/constants'
import rideService from '@/services/ride.service'
import paymentService from '@/services/payment.service'

const methods = [
  { value: PAYMENT_METHODS.CASH, label: 'Cash' },
  { value: PAYMENT_METHODS.TESLA_WALLET, label: 'Tesla Wallet' },
]
export default function PaymentsPage() {
  const rides = useApi(rideService.getMyRides, [])
  const payments = useApi(paymentService.getMyPayments, [])
  const [paying, setPaying] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [method, setMethod] = useState(PAYMENT_METHODS.CASH)
  const [error, setError] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const history = payments.data ?? []
  const paidIds = new Set(history.filter((p) => p.status === 'PAID').map((p) => p.ride_id))
  const unpaid = (rides.data ?? []).filter(
    (r) => r.status === RIDE_STATUS.COMPLETED && !paidIds.has(r.id),
  )
  async function pay(rideId) {
    setPaying(rideId)
    setError(null)
    setReceipt(null)
    try {
      setReceipt(await paymentService.payForRide(rideId, method))
      setConfirmId(null)
      rides.reload()
      payments.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setPaying(null)
    }
  }
  return (
    <>
      <PageHeader
        title="All settled, all simple."
        description="Pay for completed journeys and keep every receipt in one place."
        eyebrow="YOUR PAYMENTS"
      />
      {receipt && (
        <Alert tone="success" className="mt-6">
          Payment of {formatTaka(receipt.amount)} BDT recorded for ride #{receipt.ride_id}.
        </Alert>
      )}
      {error && (
        <Alert tone="error" className="mt-6">
          {error}
        </Alert>
      )}
      {rides.error || payments.error ? (
        <div className="mt-8">
          <Alert tone="error">{rides.error?.message ?? payments.error?.message}</Alert>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              rides.reload()
              payments.reload()
            }}
          >
            Try again
          </Button>
        </div>
      ) : (rides.loading && rides.data === null) || (payments.loading && payments.data === null) ? (
        <div className="py-20">
          <Spinner label="Loading your payments" />
        </div>
      ) : (
        <>
          <Card className="mt-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name="wallet" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-brand-900">Ready to pay</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Your completed rides awaiting payment.
                </p>
              </div>
            </div>
            {!unpaid.length ? (
              <EmptyState
                icon="check"
                title="You’re all caught up"
                description="No completed rides are waiting for payment. Enjoy your next journey."
              />
            ) : (
              <div className="space-y-4">
                {unpaid.map((ride) => (
                  <div key={ride.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-500">RIDE #{ride.id}</p>
                        <h3 className="mt-2 font-semibold text-brand-900">
                          {ride.pickup_location} → {ride.destination_location}
                        </h3>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Completed {formatDateTime(ride.completed_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-brand-900">
                          {formatTaka(ride.fare)}{' '}
                          <span className="text-xs font-normal text-slate-500">BDT</span>
                        </span>
                        {confirmId !== ride.id && (
                          <Button
                            size="sm"
                            disabled={paying !== null || rides.loading || payments.loading}
                            onClick={() => setConfirmId(ride.id)}
                          >
                            Pay ride
                          </Button>
                        )}
                      </div>
                    </div>
                    {confirmId === ride.id && (
                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <Select
                          label={'Payment method for ride #' + ride.id}
                          options={methods}
                          value={method}
                          onChange={(e) => setMethod(e.target.value)}
                          disabled={paying !== null}
                        />
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          Confirm to record this ride as paid using your selected method.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            loading={paying === ride.id}
                            disabled={paying !== null && paying !== ride.id}
                            onClick={() => pay(ride.id)}
                          >
                            Confirm {formatTaka(ride.fare)} BDT <Icon name="check" />
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={paying !== null}
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="mt-6">
            <h2 className="text-lg font-bold text-brand-900">Payment history</h2>
            <p className="mt-1 mb-6 text-sm text-slate-500">
              A record of the journeys you’ve paid for.
            </p>
            {!history.length ? (
              <EmptyState
                icon="wallet"
                title="Your receipts will live here"
                description="Once you pay for a completed ride, its receipt appears here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {history.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Icon name="check" className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {payment.pickup_location} → {payment.destination_location}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Ride #{payment.ride_id} · {formatDateTime(payment.created_at)} ·{' '}
                          {payment.method === PAYMENT_METHODS.CASH ? 'Cash' : 'Tesla Wallet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-brand-900">
                        {formatTaka(payment.amount)} BDT
                      </span>
                      <Badge status={payment.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </>
  )
}
