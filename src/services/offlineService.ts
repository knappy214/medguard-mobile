import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * OfflineService coordinates intelligent offline handling and sync for the app.
 * - Network-aware: probes a lightweight health endpoint to determine online status and RTT
 * - Battery-aware: reduces sync intensity when battery is low
 * - Conflict-aware: merges server/local using medical data priorities
 */
export interface NetworkStatus {
  isOnline: boolean
  rttMs?: number
}

type SyncFrequency = 'normal' | 'power_saving'

interface QueueItem {
  id: string
  action: string
  payload: any
  queuedAt: string
}

/**
 * Simple conflict resolver implementing domain-specific priority rules.
 */
class ConflictResolver {
  /**
   * Resolve conflicts between local and server data using a policy.
   * Currently supports 'medical_priority'.
   */
  resolve(localData: any, serverData: any, policy: 'medical_priority'): any {
    if (policy !== 'medical_priority') return serverData ?? localData

    const result: any = { ...serverData }

    // 1) Recent medication logs (local wins if newer)
    if (localData?.medicationLogs || serverData?.medicationLogs) {
      const mergedLogs = this.mergeLogs(localData?.medicationLogs ?? [], serverData?.medicationLogs ?? [])
      result.medicationLogs = mergedLogs
    }

    // 2) Prescription changes (server wins)
    if (serverData?.prescriptions) {
      result.prescriptions = serverData.prescriptions
    } else if (localData?.prescriptions && !serverData?.prescriptions) {
      result.prescriptions = localData.prescriptions
    }

    // 3) User preferences (local wins)
    if (localData?.userPreferences) {
      result.userPreferences = { ...(serverData?.userPreferences ?? {}), ...localData.userPreferences }
    }

    // Fallback: prefer server for unlisted sections, fill with local if missing
    for (const key of Object.keys(localData || {})) {
      if (result[key] === undefined) {
        result[key] = localData[key]
      }
    }
    return result
  }

  private mergeLogs(localLogs: any[], serverLogs: any[]): any[] {
    const byId = new Map<string, any>()
    for (const log of serverLogs) {
      if (!log?.id) continue
      byId.set(String(log.id), log)
    }
    for (const log of localLogs) {
      if (!log?.id) continue
      const id = String(log.id)
      const existing = byId.get(id)
      if (!existing) {
        byId.set(id, log)
      } else {
        const a = Date.parse(log.updatedAt || log.timestamp || log.actualTime || log.scheduledTime || '') || 0
        const b = Date.parse(existing.updatedAt || existing.timestamp || existing.actualTime || existing.scheduledTime || '') || 0
        if (a >= b) byId.set(id, log)
      }
    }
    // Additionally include any logs without ids by timestamp
    const noId = [...localLogs, ...serverLogs].filter((l) => !l?.id)
    const merged = [...Array.from(byId.values()), ...noId]
    // Keep most recent first, cap to 1000 to avoid memory growth
    merged.sort((x, y) => (Date.parse(y.timestamp || y.updatedAt || y.actualTime || y.scheduledTime || '') || 0) - (Date.parse(x.timestamp || x.updatedAt || x.actualTime || x.scheduledTime || '') || 0))
    return merged.slice(0, 1000)
  }
}

export class OfflineService {
  private syncQueue: QueueItem[] = []
  private conflictResolver = new ConflictResolver()
  private readonly queueStorageKey = 'offline_service_sync_queue'
  private readonly healthUrl = 'https://api.medguard-sa.com/api/health/'

  /**
   * Perform a smart sync cycle: decide online/offline path and apply backoff.
   */
  async smartSync(): Promise<void> {
    const networkStatus = await this.checkNetworkQuality()
    if (networkStatus.isOnline) {
      await this.syncWithBackoff()
    } else {
      await this.optimizeOfflineStorage()
    }
  }

  /**
   * Intelligent conflict resolution wrapper with domain-specific policy.
   */
  async resolveConflicts(localData: any, serverData: any): Promise<any> {
    return this.conflictResolver.resolve(localData, serverData, 'medical_priority')
  }

  /**
   * Battery-aware sync scheduling with simple backoff policy.
   */
  private async syncWithBackoff(): Promise<void> {
    const batteryLevel = await this.getBatteryLevel()
    const syncFrequency: SyncFrequency = batteryLevel !== null && batteryLevel > 0.2 ? 'normal' : 'power_saving'
    await this.executeSync(syncFrequency)
  }

  /**
   * Execute queued sync and coordinate with ApiService's offline queue.
   * In power_saving mode, process fewer items per tick.
   */
  private async executeSync(mode: SyncFrequency): Promise<void> {
    await this.loadQueue()

    // Try to sync ApiService's offline queue first to keep behaviour consistent
    try {
      const api = await import('./apiService')
      await api.default.syncOfflineActions()
    } catch (err) {
      // no-op if apiService not available
    }

    const batchSize = mode === 'normal' ? 50 : 10
    const processing = this.syncQueue.splice(0, batchSize)

    for (const item of processing) {
      try {
        await this.dispatchAction(item)
      } catch (error) {
        // Requeue on failure for retry later
        this.syncQueue.push(item)
        break
      }
    }

    await this.saveQueue()
  }

  /**
   * Dispatch a queued action to the appropriate service.
   */
  private async dispatchAction(item: QueueItem): Promise<void> {
    switch (item.action) {
      case 'log_medication': {
        const api = (await import('./apiService')).default
        await api.logMedicationTaken(item.payload.scheduleId, new Date(item.payload.actualTime), item.payload.notes)
        return
      }
      default:
        // Unknown actions are ignored (or could be sent to a generic endpoint)
        return
    }
  }

  /**
   * Optimize offline storage by trimming queue and de-duplicating.
   */
  private async optimizeOfflineStorage(): Promise<void> {
    await this.loadQueue()
    // De-duplicate by action+payload key if present
    const seen = new Set<string>()
    const deduped: QueueItem[] = []
    for (const item of this.syncQueue) {
      const key = `${item.action}:${JSON.stringify(item.payload ?? {})}`
      if (!seen.has(key)) {
        seen.add(key)
        deduped.push(item)
      }
    }
    // Trim to last 500 entries to cap storage use
    this.syncQueue = deduped.slice(-500)
    await this.saveQueue()
  }

  /**
   * Probe a health endpoint and measure RTT. Consider online if HEAD succeeds within timeout.
   */
  async checkNetworkQuality(timeoutMs = 4000): Promise<NetworkStatus> {
    try {
      const started = Date.now()
      const controller = new AbortController()
      const id = setTimeout(() => controller.abort(), timeoutMs)
      const res = await fetch(this.healthUrl, { method: 'HEAD', signal: controller.signal as any })
      clearTimeout(id)
      if (res.ok) {
        const rttMs = Date.now() - started
        return { isOnline: true, rttMs }
      }
      return { isOnline: false }
    } catch {
      return { isOnline: false }
    }
  }

  /**
   * Attempt to read battery level via optional dynamic import. Returns 0..1 or null if unavailable.
   */
  private async getBatteryLevel(): Promise<number | null> {
    // Try window-like global (web), then React Native BatteryManager, else null
    try {
      // @ts-ignore
      if (typeof navigator !== 'undefined' && navigator.getBattery) {
        // @ts-ignore
        const battery = await navigator.getBattery()
        const lvl = battery?.level
        if (typeof lvl === 'number') return lvl
      }
    } catch {}

    try {
      // Fallback to a custom native module if present
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { NativeModules } = require('react-native')
      const BatteryManager = NativeModules?.RNMedGuardBatteryManager
      if (BatteryManager?.getBatteryLevel) {
        const lvl = await BatteryManager.getBatteryLevel()
        if (typeof lvl === 'number') return lvl
      }
    } catch {}

    return null
  }

  /**
   * Enqueue an offline action for later sync.
   */
  async enqueue(action: string, payload: any): Promise<void> {
    await this.loadQueue()
    this.syncQueue.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      action,
      payload,
      queuedAt: new Date().toISOString(),
    })
    await this.saveQueue()
  }

  private async loadQueue(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(this.queueStorageKey)
      this.syncQueue = raw ? JSON.parse(raw) : []
    } catch {
      this.syncQueue = []
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.queueStorageKey, JSON.stringify(this.syncQueue))
    } catch {
      // Ignore storage errors to avoid crashing app in low-space situations
    }
  }
}

const offlineService = new OfflineService()
export default offlineService


