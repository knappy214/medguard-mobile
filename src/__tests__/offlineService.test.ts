import offlineService from '../services/offlineService'

describe('OfflineService conflict resolution', () => {
  test('medical_priority merges with correct precedence', async () => {
    const local = {
      medicationLogs: [
        { id: '1', status: 'taken', timestamp: '2025-08-09T10:00:00Z' },
        { status: 'missed', timestamp: '2025-08-09T11:00:00Z' }, // no id
      ],
      prescriptions: [{ id: 'rx1', dose: '10mg (local)' }],
      userPreferences: { reminders: true, tone: 'chime' },
    }
    const server = {
      medicationLogs: [
        { id: '1', status: 'missed', timestamp: '2025-08-09T09:00:00Z' },
      ],
      prescriptions: [{ id: 'rx1', dose: '20mg (server)' }],
      userPreferences: { reminders: false },
    }

    // @ts-expect-error access internal method via any cast for test simplicity
    const merged = await (offlineService as any).conflictResolver.resolve(local, server, 'medical_priority')

    // Local log should win by newer timestamp
    expect(merged.medicationLogs.find((l: any) => l.id === '1').status).toBe('taken')
    // Log without id should be preserved
    expect(merged.medicationLogs.some((l: any) => !l.id)).toBe(true)
    // Prescriptions from server win
    expect(merged.prescriptions[0].dose).toContain('(server)')
    // User preferences from local override server
    expect(merged.userPreferences.reminders).toBe(true)
    expect(merged.userPreferences.tone).toBe('chime')
  })
})

describe('OfflineService queue', () => {
  test('enqueue adds item and optimizeOfflineStorage deduplicates', async () => {
    // Enqueue duplicates
    await offlineService.enqueue('log_medication', { a: 1 })
    await offlineService.enqueue('log_medication', { a: 1 })
    await (offlineService as any).optimizeOfflineStorage()

    // Load queue via private read
    await (offlineService as any).loadQueue()
    const q = (offlineService as any).syncQueue as any[]
    const keys = q.map((it) => `${it.action}:${JSON.stringify(it.payload)}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })
})


