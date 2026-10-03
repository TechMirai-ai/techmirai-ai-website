export { createBooking } from './create-booking'
export type {
  CreateBookingInput,
  CreateBookingResult,
  BookingAppointment,
} from './create-booking'

export { cancelBooking } from './cancel-booking'
export type { CancelBookingResult, CancelledAppointment } from './cancel-booking'

export { BookingError, SlotUnavailableError } from './errors'

export {
  applyBookingIndexes,
  dropBookingIndexes,
  up as bookingIndexesUp,
  down as bookingIndexesDown,
} from './migrations/booking-indexes'
export type { DdlExecutor } from './migrations/booking-indexes'

export {
  applyCustomerLineFields,
  dropCustomerLineFields,
  up as customerLineFieldsUp,
  down as customerLineFieldsDown,
} from './migrations/customer-line-fields'
