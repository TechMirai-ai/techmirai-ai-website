import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getDemoKeyTier, isValidDemoKey } from './demo-access-key'

test('accepts a key that is in the list', () => {
  assert.equal(isValidDemoKey('alpha-1', 'alpha-1,beta-2'), true)
  assert.equal(isValidDemoKey('beta-2', 'alpha-1,beta-2'), true)
})

test('ignores spaces around the keys in the list and around the input', () => {
  assert.equal(isValidDemoKey('  beta-2 ', 'alpha-1 , beta-2 '), true)
})

test('rejects a key that is not in the list', () => {
  assert.equal(isValidDemoKey('gamma-3', 'alpha-1,beta-2'), false)
})

test('rejects a prefix or longer variant of a real key', () => {
  assert.equal(isValidDemoKey('alpha', 'alpha-1'), false)
  assert.equal(isValidDemoKey('alpha-1-extra', 'alpha-1'), false)
})

test('rejects everything when the list is unset or empty', () => {
  assert.equal(isValidDemoKey('anything', undefined), false)
  assert.equal(isValidDemoKey('anything', ''), false)
  assert.equal(isValidDemoKey('', ''), false)
  assert.equal(isValidDemoKey('', ' , '), false)
})

test('tier is access for a key in the access list', () => {
  assert.equal(getDemoKeyTier('alpha-1', 'alpha-1', 'beta-2'), 'access')
})

test('tier is normal for a key only in the normal list', () => {
  assert.equal(getDemoKeyTier('beta-2', 'alpha-1', 'beta-2'), 'normal')
})

test('tier is access when a key is in both lists', () => {
  assert.equal(getDemoKeyTier('alpha-1', 'alpha-1', 'alpha-1'), 'access')
})

test('tier is null for an unknown key or empty lists', () => {
  assert.equal(getDemoKeyTier('gamma-3', 'alpha-1', 'beta-2'), null)
  assert.equal(getDemoKeyTier('alpha-1', undefined, undefined), null)
  assert.equal(getDemoKeyTier('', 'alpha-1', 'beta-2'), null)
})
