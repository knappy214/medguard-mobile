import AsyncStorage from '@react-native-async-storage/async-storage'

export interface AdherenceEvent {
  medicationId: number
  adherenceRate: number // 0..100
  timestamp: string // ISO string
  factors: Record<string, string | number | boolean>
}

export interface AnonymizedAdherenceEvent {
  hashedMedicationId: string
  adherenceRateBucket: number // rounded bucket
  dayOfWeek: number
  hourOfDay: number
  timestampDate: string // yyyy-mm-dd only
  factors: Record<string, string | number | boolean>
  client: 'mobile'
  appVersion?: string
}

export interface AdherenceReport {
  overallAdherence: number
  riskFactors: string[]
  recommendations: string[]
  southAfricanBenchmarks: {
    targetAdherencePercent: number
    adherenceGoodThreshold: number
    adherenceRiskThreshold: number
  }
}

/**
 * MedicalAnalyticsService
 *
 * Privacy-first adherence analytics (POPIA compliant):
 * - Stores only anonymized, non-identifying aggregates remotely
 * - Keeps raw events locally for on-device insights and reports
 */
export class MedicalAnalyticsService {
  private readonly localEventsKey = 'analytics_adherence_events_v1'

  /**
   * Track medication adherence for a given medication.
   * Sends anonymized analytics and stores local copy for insights.
   */
  async trackAdherence(medicationId: number, adherenceRate: number): Promise<void> {
    const adherenceData: AdherenceEvent = {
      medicationId,
      adherenceRate,
      timestamp: new Date().toISOString(),
      factors: await this.analyzeAdherenceFactors(),
    }

    // Persist locally for reports
    await this.appendLocalEvent(adherenceData)

    // Send anonymized analytics
    await this.sendSecureAnalytics(adherenceData)
  }

  /**
   * Generate an adherence report suitable for healthcare providers.
   */
  async generateAdherenceReport(): Promise<AdherenceReport> {
    const data = await this.getAdherenceData()
    return {
      overallAdherence: this.calculateOverallAdherence(data),
      riskFactors: this.identifyRiskFactors(data),
      recommendations: this.generateRecommendations(data),
      southAfricanBenchmarks: await this.getSABenchmarks(),
    }
  }

  // -------------------- Internals (privacy-first) --------------------

  private async analyzeAdherenceFactors(): Promise<Record<string, string | number | boolean>> {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay() // 0..6

    const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    const isWeekend = day === 0 || day === 6
    return {
      timeOfDay,
      isWeekend,
      hour,
      day,
    }
  }

  private async appendLocalEvent(event: AdherenceEvent): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(this.localEventsKey)
      const existing: AdherenceEvent[] = raw ? JSON.parse(raw) : []
      // Cap local storage to last 500 events
      const next = [...existing.slice(-499), event]
      await AsyncStorage.setItem(this.localEventsKey, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }

  private async getAdherenceData(): Promise<AdherenceEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(this.localEventsKey)
      return raw ? (JSON.parse(raw) as AdherenceEvent[]) : []
    } catch {
      return []
    }
  }

  private calculateOverallAdherence(data: AdherenceEvent[]): number {
    if (!data.length) return 0
    const sum = data.reduce((acc, e) => acc + (isFinite(e.adherenceRate) ? e.adherenceRate : 0), 0)
    const avg = sum / data.length
    return Math.round(avg * 10) / 10 // 1 decimal place
  }

  private identifyRiskFactors(data: AdherenceEvent[]): string[] {
    const risks: string[] = []
    if (!data.length) return risks

    // Time-of-day risk: find lowest adherence time window
    const buckets = new Map<string, { total: number; count: number }>()
    for (const e of data) {
      const tod = (e.factors.timeOfDay as string) || 'unknown'
      const b = buckets.get(tod) || { total: 0, count: 0 }
      b.total += e.adherenceRate
      b.count += 1
      buckets.set(tod, b)
    }
    let worst: { tod: string; avg: number } | null = null
    for (const [tod, { total, count }] of buckets.entries()) {
      const avg = total / count
      if (!worst || avg < worst.avg) worst = { tod, avg }
    }
    if (worst && worst.avg < 70) {
      risks.push(`Lower adherence during ${worst.tod}`)
    }

    // Weekend risk
    const weekend = data.filter((e) => e.factors.isWeekend === true)
    if (weekend.length) {
      const wkAvg = weekend.reduce((a, e) => a + e.adherenceRate, 0) / weekend.length
      const weekday = data.filter((e) => e.factors.isWeekend !== true)
      const wdAvg = weekday.length ? weekday.reduce((a, e) => a + e.adherenceRate, 0) / weekday.length : wkAvg
      if (wkAvg + 5 < wdAvg) risks.push('Weekend adherence dip')
    }

    return risks
  }

  private generateRecommendations(data: AdherenceEvent[]): string[] {
    const recs: string[] = []
    if (!data.length) return recs
    const overall = this.calculateOverallAdherence(data)
    if (overall < 80) recs.push('Increase reminder frequency or adjust dosing times')
    if (overall < 60) recs.push('Consider caregiver notifications or pill organizer')

    // Time-of-day specific recommendation
    const risks = this.identifyRiskFactors(data)
    for (const r of risks) {
      if (r.includes('morning')) recs.push('Try moving morning doses closer to breakfast')
      if (r.includes('evening')) recs.push('Set a bedtime alarm for evening doses')
      if (r.includes('Weekend')) recs.push('Plan weekend routines with dose reminders')
    }
    return Array.from(new Set(recs))
  }

  private async getSABenchmarks(): Promise<AdherenceReport['southAfricanBenchmarks']> {
    // Static placeholders; replace with real SA data if available
    return {
      targetAdherencePercent: 95,
      adherenceGoodThreshold: 85,
      adherenceRiskThreshold: 70,
    }
  }

  // -------- Privacy: outbound analytics is strictly anonymized --------

  private async sendSecureAnalytics(data: AdherenceEvent): Promise<void> {
    const anonymized = this.anonymizeHealthData(data)
    await this.sendToAnalytics(anonymized)
  }

  private anonymizeHealthData(event: AdherenceEvent): AnonymizedAdherenceEvent {
    const date = new Date(event.timestamp)
    const yyyy = date.getUTCFullYear()
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(date.getUTCDate()).padStart(2, '0')
    const bucket = Math.min(100, Math.max(0, Math.round(event.adherenceRate / 5) * 5)) // 5% buckets

    return {
      hashedMedicationId: this.fnv1aHash(String(event.medicationId)),
      adherenceRateBucket: bucket,
      dayOfWeek: date.getUTCDay(),
      hourOfDay: date.getUTCHours(),
      timestampDate: `${yyyy}-${mm}-${dd}`,
      factors: event.factors,
      client: 'mobile',
    }
  }

  private async sendToAnalytics(payload: AnonymizedAdherenceEvent): Promise<void> {
    try {
      // Replace with real analytics endpoint
      await fetch('https://analytics.medguard-sa.com/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      // Network unavailable: buffer locally for later
      try {
        const key = 'analytics_event_queue_v1'
        const raw = await AsyncStorage.getItem(key)
        const q = raw ? JSON.parse(raw) : []
        q.push({ payload, queuedAt: Date.now() })
        await AsyncStorage.setItem(key, JSON.stringify(q.slice(-200)))
      } catch {
        // ignore
      }
    }
  }

  // Deterministic fast hash (FNV-1a) to anonymize IDs locally
  private fnv1aHash(input: string): string {
    let hash = 0x811c9dc5
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    // Return as base36 to shorten length
    return hash.toString(36)
  }
}

const medicalAnalyticsService = new MedicalAnalyticsService()
export default medicalAnalyticsService


