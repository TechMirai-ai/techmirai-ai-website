/** Base class for all booking-engine failures. */
export class BookingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingError'
  }
}

/**
 * Thrown when a slot cannot accept another booking because it is full,
 * blocked, or closed. Maps to the conditional UPDATE affecting zero rows.
 */
export class SlotUnavailableError extends BookingError {
  constructor(message = 'The slot is full, blocked, or closed and cannot be booked') {
    super(message)
    this.name = 'SlotUnavailableError'
  }
}
