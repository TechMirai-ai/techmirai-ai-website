// Text for the demo entry cards, the access-key form and the Register form.
// One list drives the Payload fields, the adapter and the typed props, so a
// label added here shows up in all three.
export const ACCESS_COPY_KEYS = [
  'audioCardTitle',
  'audioCardSub',
  'liveCardTitle',
  'liveCardSub',
  'keyTitle',
  'keySubmitLabel',
  'keyInvalid',
  'keyError',
  'noKeyPrefix',
  'registerLinkLabel',
  'registerTitle',
  'nameLabel',
  'contactNoLabel',
  'emailLabel',
  'companyLabel',
  'purposeLabel',
  'registerSubmitLabel',
  'registerSending',
  'registerError',
  'registeredTitle',
  'registeredBody',
  'backLabel',
] as const

export type AccessCopyKey = (typeof ACCESS_COPY_KEYS)[number]
export type AccessCopy = Record<AccessCopyKey, string>
