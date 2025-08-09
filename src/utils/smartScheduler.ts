import { format, isWithinInterval } from 'date-fns'

/**
 * Minimal medication shape used for interaction heuristics.
 */
export interface MedicationLike {
  name?: string
  interactions?: string[]
  enrichedData?: {
    interactions?: Array<{ medications: string[] }>
  }
}

/**
 * Lightweight schedule shape accepted by SmartMedicationScheduler.
 */
export interface ScheduleLike {
  id?: string | number
  medication?: MedicationLike
  medicationId?: string | number
  time?: string // HH:MM
  scheduledTime?: string // HH:MM
  mealRelation?: 'before_meal' | 'with_meal' | 'after_meal' | 'empty_stomach' | 'any'
}

export interface MealTimes {
  breakfast: string // HH:MM
  lunch: string // HH:MM
  dinner: string // HH:MM
}

/**
 * Minimal conflict entry for quick UI surfacing.
 */
export interface SmartScheduleConflict {
  type: 'interaction' | 'timing_overlap' | 'meal_conflict'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  relatedSchedule: ScheduleLike
}

/**
 * South African typical meal times used as defaults where none are provided.
 */
const DEFAULT_MEAL_TIMES: MealTimes = {
  breakfast: '07:00',
  lunch: '13:00',
  dinner: '19:00'
}

function toToday(timeHHmm: string): Date {
  if (!timeHHmm || !/^\d{1,2}:\d{2}$/.test(timeHHmm)) {
    return new Date(NaN)
  }
  const parts = timeHHmm.split(':')
  if (parts.length !== 2) return new Date(NaN)
  const [hStr, mStr] = parts as [string, string]
  const h = Number(hStr)
  const m = Number(mStr)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function diffMinutes(a: Date, b: Date): number {
  return Math.abs(Math.round((a.getTime() - b.getTime()) / 60000))
}

function getScheduleTime(s: ScheduleLike): string | undefined {
  return s.time || s.scheduledTime
}

function isWithinMinutesOf(a: Date, b: Date, minutes: number): boolean {
  return diffMinutes(a, b) <= minutes
}

function mealWindow(time: string, beforeMinutes: number, afterMinutes: number) {
  const center = toToday(time)
  return {
    start: new Date(center.getTime() - beforeMinutes * 60000),
    end: new Date(center.getTime() + afterMinutes * 60000)
  }
}

/**
 * SmartMedicationScheduler provides conflict detection and dosing time optimization.
 */
export class SmartMedicationScheduler {
  /**
   * Detect potential conflicts between a new schedule and existing ones.
   * Returns the subset of existing schedules that conflict.
   */
  static detectScheduleConflicts(newSchedule: ScheduleLike, existingSchedules: ScheduleLike[]): ScheduleLike[] {
    return existingSchedules.filter((schedule) => {
      // Drug interaction heuristic
      if (this.hasInteraction(newSchedule.medication, schedule.medication)) {
        return true
      }

      // Timing/meal conflicts
      return this.hasTimingConflict(newSchedule, schedule)
    })
  }

  /**
   * Suggest optimal dosing times based on frequency and typical SA meal times.
   * Frequencies supported: once_daily, twice_daily, three_times_daily|thrice_daily, four_times_daily.
   */
  static optimizeDosingTimes(frequency: string, mealTimes?: Partial<MealTimes>): string[] {
    const meals: MealTimes = { ...DEFAULT_MEAL_TIMES, ...(mealTimes || {}) }
    return this.calculateOptimalTimes(frequency, meals)
  }

  /**
   * Very lightweight interaction heuristic using available fields.
   */
  private static hasInteraction(a?: MedicationLike, b?: MedicationLike): boolean {
    if (!a || !b) return false
    const aName = (a.name || '').toLowerCase().trim()
    const bName = (b.name || '').toLowerCase().trim()

    if (!aName || !bName) return false

    // If either medication lists the other by name in interactions
    const aInteracts = (a.interactions || []).some((n) => n.toLowerCase().includes(bName))
    const bInteracts = (b.interactions || []).some((n) => n.toLowerCase().includes(aName))

    // If enriched data exists, check interaction medication lists
    const aEnrichedInteracts = (a.enrichedData?.interactions || []).some((i) =>
      i.medications.some((n) => n.toLowerCase().includes(bName))
    )
    const bEnrichedInteracts = (b.enrichedData?.interactions || []).some((i) =>
      i.medications.some((n) => n.toLowerCase().includes(aName))
    )

    return aInteracts || bInteracts || aEnrichedInteracts || bEnrichedInteracts
  }

  /**
   * Detect timing conflicts based on proximity and meal relations.
   */
  private static hasTimingConflict(a: ScheduleLike, b: ScheduleLike): boolean {
    const tA = getScheduleTime(a)
    const tB = getScheduleTime(b)
    if (!tA || !tB) return false

    const dA = toToday(tA)
    const dB = toToday(tB)

    if (Number.isNaN(dA.getTime()) || Number.isNaN(dB.getTime())) {
      return false
    }

    // Overlap threshold: 30 minutes proximity = conflict
    if (isWithinMinutesOf(dA, dB, 30)) return true

    // Meal relation conflicts
    const ar = a.mealRelation || 'any'
    const br = b.mealRelation || 'any'

    // Empty stomach vs with/after meal within ±2h window of meal is conflicting
    const meals = DEFAULT_MEAL_TIMES
    const mealWindows = [
      mealWindow(meals.breakfast, 120, 60),
      mealWindow(meals.lunch, 120, 60),
      mealWindow(meals.dinner, 120, 60)
    ]

    const aInMealWindow = mealWindows.some((w) => isWithinInterval(dA, w))
    const bInMealWindow = mealWindows.some((w) => isWithinInterval(dB, w))

    if ((ar === 'empty_stomach' && bInMealWindow) || (br === 'empty_stomach' && aInMealWindow)) {
      return true
    }

    // Before_meal should not collide with with_meal/after_meal within 60 minutes
    if (
      (ar === 'before_meal' && (br === 'with_meal' || br === 'after_meal') && isWithinMinutesOf(dA, dB, 60)) ||
      (br === 'before_meal' && (ar === 'with_meal' || ar === 'after_meal') && isWithinMinutesOf(dA, dB, 60))
    ) {
      return true
    }

    return false
  }

  /**
   * Internal: determine optimal times for common dosing frequencies.
   */
  private static calculateOptimalTimes(frequency: string, mealTimes: MealTimes): string[] {
    const f = frequency.toLowerCase().replace(/\s+/g, '_')

    const breakfast = mealTimes.breakfast
    const lunch = mealTimes.lunch
    const dinner = mealTimes.dinner
    const bedtime = '21:00'

    if (f.includes('once') || f.includes('once_daily') || f === 'qd' || f === 'od' || f === 'daily') {
      return [breakfast]
    }

    if (f.includes('twice') || f.includes('twice_daily') || f === 'bid' || f.includes('2x')) {
      return [breakfast, dinner]
    }

    if (f.includes('three') || f.includes('thrice') || f.includes('three_times_daily') || f === 'tid' || f.includes('3x')) {
      return [breakfast, lunch, dinner]
    }

    if (f.includes('four') || f.includes('four_times_daily') || f === 'qid' || f.includes('4x')) {
      return [breakfast, midTime(breakfast, lunch), dinner, bedtime]
    }

    return [breakfast, dinner]
  }
}

/**
 * Midpoint between two HH:MM times, formatted HH:MM.
 */
function midTime(a: string, b: string): string {
  const da = toToday(a)
  const db = toToday(b)
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) {
    return '12:00'
  }
  const mid = new Date((da.getTime() + db.getTime()) / 2)
  return format(mid, 'HH:mm')
}


