import { SmartMedicationScheduler } from '../utils/smartScheduler'

describe('SmartMedicationScheduler.optimizeDosingTimes', () => {
  test('once daily defaults to breakfast (07:00)', () => {
    const times = SmartMedicationScheduler.optimizeDosingTimes('once_daily')
    expect(times).toEqual(['07:00'])
  })

  test('twice daily maps to breakfast and dinner', () => {
    const times = SmartMedicationScheduler.optimizeDosingTimes('twice_daily')
    expect(times).toEqual(['07:00', '19:00'])
  })

  test('three times daily aligns to meals', () => {
    const times = SmartMedicationScheduler.optimizeDosingTimes('three_times_daily')
    expect(times).toEqual(['07:00', '13:00', '19:00'])
  })

  test('four times daily includes midpoint and bedtime', () => {
    const times = SmartMedicationScheduler.optimizeDosingTimes('four_times_daily')
    expect(times).toEqual(['07:00', '10:00', '19:00', '21:00'])
  })
})

describe('SmartMedicationScheduler.detectScheduleConflicts', () => {
  test('detects 30-minute proximity timing overlap', () => {
    const newSchedule = { time: '08:00', medication: { name: 'MedA' } }
    const existing = [{ time: '08:20', medication: { name: 'MedB' } }]
    const conflicts = SmartMedicationScheduler.detectScheduleConflicts(newSchedule, existing)
    expect(conflicts.length).toBe(1)
  })

  test('detects empty stomach conflict within meal window', () => {
    const newSchedule = { time: '07:30', medication: { name: 'MedA' }, mealRelation: 'empty_stomach' as const }
    const existing = [{ time: '07:30', medication: { name: 'MedB' }, mealRelation: 'with_meal' as const }]
    const conflicts = SmartMedicationScheduler.detectScheduleConflicts(newSchedule, existing)
    expect(conflicts.length).toBe(1)
  })

  test('detects before_meal vs with_meal conflict within 60 minutes', () => {
    const newSchedule = { time: '12:30', medication: { name: 'MedA' }, mealRelation: 'before_meal' as const }
    const existing = [{ time: '13:00', medication: { name: 'MedB' }, mealRelation: 'with_meal' as const }]
    const conflicts = SmartMedicationScheduler.detectScheduleConflicts(newSchedule, existing)
    expect(conflicts.length).toBe(1)
  })

  test('detects interaction-based conflicts', () => {
    const newSchedule = { time: '09:00', medication: { name: 'Warfarin', interactions: ['Aspirin'] } }
    const existing = [{ time: '11:00', medication: { name: 'Aspirin' } }]
    const conflicts = SmartMedicationScheduler.detectScheduleConflicts(newSchedule, existing)
    expect(conflicts.length).toBe(1)
  })

  test('ignores invalid times gracefully', () => {
    const newSchedule = { time: 'invalid', medication: { name: 'MedA' } }
    const existing = [{ time: '08:00', medication: { name: 'MedB' } }]
    const conflicts = SmartMedicationScheduler.detectScheduleConflicts(newSchedule, existing)
    expect(conflicts.length).toBe(0)
  })
})


