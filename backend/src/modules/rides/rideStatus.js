// Allowed ride transitions and cancellation states.
const RIDE_STATUS = {
  REQUESTED: "REQUESTED",
  MATCHED: "MATCHED",
  DRIVER_ARRIVED: "DRIVER_ARRIVED",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const ALLOWED_TRANSITIONS = {
  [RIDE_STATUS.REQUESTED]: [RIDE_STATUS.MATCHED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.MATCHED]: [RIDE_STATUS.DRIVER_ARRIVED, RIDE_STATUS.CANCELLED],
  [RIDE_STATUS.DRIVER_ARRIVED]: [RIDE_STATUS.ONGOING],
  [RIDE_STATUS.ONGOING]: [RIDE_STATUS.COMPLETED],
  [RIDE_STATUS.COMPLETED]: [],
  [RIDE_STATUS.CANCELLED]: [],
};

const CANCELLABLE_STATUSES = [
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.MATCHED,
];

const canTransition = (from, to) => {
  const allowed = ALLOWED_TRANSITIONS[from];

  return Array.isArray(allowed) && allowed.includes(to);
};

const isCancellable = (status) => CANCELLABLE_STATUSES.includes(status);

const isTerminal = (status) =>
  status === RIDE_STATUS.COMPLETED || status === RIDE_STATUS.CANCELLED;

module.exports = {
  RIDE_STATUS,
  ALLOWED_TRANSITIONS,
  CANCELLABLE_STATUSES,
  canTransition,
  isCancellable,
  isTerminal,
};
