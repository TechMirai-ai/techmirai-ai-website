import type { CollectionConfig } from 'payload'

import { BookableServicesCollection } from './bookable-services'
import { ResourcesCollection } from './resources'
import { SlotsCollection } from './slots'
import { CustomersCollection } from './customers'
import { AppointmentsCollection } from './appointments'
import { NotificationsCollection } from './notifications'

export {
  BookableServicesCollection,
  ResourcesCollection,
  SlotsCollection,
  CustomersCollection,
  AppointmentsCollection,
  NotificationsCollection,
}

/**
 * The booking collections as one unit, in dependency order (relationships
 * resolve targets that appear earlier). Register these together.
 */
export function bookingCollections(): CollectionConfig[] {
  return [
    BookableServicesCollection,
    ResourcesCollection,
    CustomersCollection,
    SlotsCollection,
    AppointmentsCollection,
    NotificationsCollection,
  ]
}
