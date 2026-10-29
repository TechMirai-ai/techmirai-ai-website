import { test } from 'node:test'
import assert from 'node:assert/strict'
import { demoRegisterSchema } from './demo-register'

const valid = {
  name: 'Taro Yamada',
  contactNo: '000-0000-0000',
  email: 'taro@example.com',
  company: 'Example KK',
  purpose: 'Evaluate the voice agent',
}

test('accepts a fully filled registration', () => {
  assert.equal(demoRegisterSchema.safeParse(valid).success, true)
})

for (const field of ['name', 'contactNo', 'email', 'company', 'purpose'] as const) {
  test(`rejects an empty ${field}`, () => {
    assert.equal(demoRegisterSchema.safeParse({ ...valid, [field]: '' }).success, false)
  })

  test(`rejects a whitespace-only ${field}`, () => {
    assert.equal(demoRegisterSchema.safeParse({ ...valid, [field]: '   ' }).success, false)
  })

  test(`rejects a missing ${field}`, () => {
    const { [field]: _omitted, ...rest } = valid
    assert.equal(demoRegisterSchema.safeParse(rest).success, false)
  })
}

test('rejects a malformed email', () => {
  assert.equal(demoRegisterSchema.safeParse({ ...valid, email: 'not-an-email' }).success, false)
})
