import { describe, it, expect } from 'vitest'
import { adaptTeamGridBlock } from './adapter'

const jamal = { id: '1', name: 'Jamal Shah', title: 'Founder', visible: true }
const abdullah = { id: '2', name: 'Abdullah Al Maruf', title: 'Co-founder', visible: true }

describe('adaptTeamGridBlock', () => {
  it('includes every member when founderVisible is true', () => {
    // Arrange
    const raw = { members: [jamal, abdullah], founderVisible: true, founderPersonId: '1' }

    // Act
    const result = adaptTeamGridBlock(raw)

    // Assert
    expect(result.members.map((m) => m.id)).toEqual(['1', '2'])
  })

  it('excludes the founder-matching member when founderVisible is false', () => {
    // Arrange
    const raw = { members: [jamal, abdullah], founderVisible: false, founderPersonId: '1' }

    // Act
    const result = adaptTeamGridBlock(raw)

    // Assert
    expect(result.members.map((m) => m.id)).toEqual(['2'])
  })

  it('keeps every member when founderVisible is false but founderPersonId matches none of them', () => {
    // Arrange
    const raw = { members: [jamal, abdullah], founderVisible: false, founderPersonId: '999' }

    // Act
    const result = adaptTeamGridBlock(raw)

    // Assert
    expect(result.members.map((m) => m.id)).toEqual(['1', '2'])
  })

  it('excludes any member whose own visible flag is false, regardless of the founder gate', () => {
    // Arrange
    const hiddenMember = { id: '3', name: 'Someone', title: 'Role', visible: false }
    const raw = { members: [jamal, hiddenMember], founderVisible: true, founderPersonId: undefined }

    // Act
    const result = adaptTeamGridBlock(raw)

    // Assert
    expect(result.members.map((m) => m.id)).toEqual(['1'])
  })

  it("builds the static partner card from the block's own partner group", () => {
    // Arrange
    const raw = {
      members: [],
      partner: { name: 'Sadiatec Co., Ltd.', role: 'Partner', line: 'Our partner since day one.' },
    }

    // Act
    const result = adaptTeamGridBlock(raw)

    // Assert
    expect(result.partner).toEqual({
      name: 'Sadiatec Co., Ltd.',
      role: 'Partner',
      line: 'Our partner since day one.',
    })
  })

  it('returns no members and no partner for empty input', () => {
    // Arrange
    const raw = {}

    // Act
    const result = adaptTeamGridBlock(raw)

    // Assert
    expect(result.members).toEqual([])
    expect(result.partner).toBeUndefined()
  })
})
