import authService from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface Medication {
  id: number;
  name: string;
  genericName?: string;
  strength: string;
  medicationType: string;
  prescriptionType: string;
  pillCount: number;
  lowStockThreshold: number;
  description?: string;
  activeIngredients?: string;
  manufacturer?: string;
  sideEffects?: string;
  contraindications?: string;
  storageInstructions?: string;
  medicationImage?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface MedicationSchedule {
  id: number;
  medication: Medication;
  patient: number;
  timing: 'morning' | 'noon' | 'night' | 'custom';
  customTime?: string;
  dosageAmount: string;
  frequency: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'paused' | 'completed';
  instructions?: string;
}

interface MedicationLog {
  id: number;
  medication: Medication;
  schedule?: MedicationSchedule;
  scheduledTime: string;
  actualTime?: string;
  status: 'taken' | 'missed' | 'skipped' | 'partial';
  dosageTaken?: string;
  notes?: string;
  sideEffects?: string;
}

interface PrescriptionOCRResult {
  prescriptionNumber: string;
  doctorName: string;
  patientName: string;
  medications: Array<{
    name: string;
    strength: string;
    dosage: string;
    frequency: string;
    quantity: string;
    instructions: string;
    confidence: number;
  }>;
  icd10Codes: string[];
  confidence: number;
  processingTime: number;
}

class ApiService {
  private baseUrl = 'https://api.medguard-sa.com';
  private wagtailApiUrl = 'https://api.medguard-sa.com/api/v2';
  
  // Cache keys for offline functionality
  private static MEDICATIONS_CACHE_KEY = 'cached_medications';
  private static SCHEDULES_CACHE_KEY = 'cached_schedules';
  private static LOGS_CACHE_KEY = 'cached_logs';
  private static CACHE_TIMESTAMP_KEY = 'cache_timestamp';
  
  // Medication Management
  async getMedications(forceRefresh = false): Promise<Medication[]> {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = await this.getCachedMedications();
        if (cached) return cached;
      }
      
      const headers = await authService.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/medications/`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch medications: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the results
      await this.cacheMedications(data.results || data);
      
      return data.results || data;
    } catch (error) {
      console.error('Get medications error:', error);
      // Return cached data if available during error
      const cached = await this.getCachedMedications();
      if (cached) return cached;
      throw error;
    }
  }
  
  async getMedicationSchedules(forceRefresh = false): Promise<MedicationSchedule[]> {
    try {
      if (!forceRefresh) {
        const cached = await this.getCachedSchedules();
        if (cached) return cached;
      }
      
      const headers = await authService.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/medication-schedules/`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }
      
      const data = await response.json();
      
      await this.cacheSchedules(data.results || data);
      
      return data.results || data;
    } catch (error) {
      console.error('Get schedules error:', error);
      const cached = await this.getCachedSchedules();
      if (cached) return cached;
      throw error;
    }
  }
  
  async logMedicationTaken(scheduleId: number, actualTime?: Date, notes?: string): Promise<MedicationLog> {
    try {
      const headers = await authService.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/medication-logs/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          schedule: scheduleId,
          status: 'taken',
          actualTime: actualTime?.toISOString() || new Date().toISOString(),
          notes,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to log medication: ${response.status}`);
      }
      
      const log = await response.json();
      
      // Update local cache
      await this.updateLogCache(log);
      
      return log;
    } catch (error) {
      console.error('Log medication error:', error);
      // Store for later sync if offline
      await this.queueOfflineAction('log_medication', {
        scheduleId,
        actualTime: actualTime?.toISOString() || new Date().toISOString(),
        notes,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
  
  async processPrescriptionOCR(imageUri: string): Promise<PrescriptionOCRResult> {
    try {
      const headers = await authService.getAuthHeaders();
      
      // Create form data for image upload
      const formData = new FormData();
      formData.append('prescription_image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'prescription.jpg',
      } as any);
      
      const response = await fetch(`${this.baseUrl}/api/prescription-ocr/`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`OCR processing failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('OCR processing error:', error);
      throw error;
    }
  }
  
  async getWagtailContent(contentType: string, slug?: string): Promise<any> {
    try {
      const url = slug 
        ? `${this.wagtailApiUrl}/pages/?type=${contentType}&slug=${slug}`
        : `${this.wagtailApiUrl}/pages/?type=${contentType}`;
        
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Wagtail content: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Wagtail content error:', error);
      throw error;
    }
  }
  
  // Cache management methods
  private async cacheMedications(medications: Medication[]): Promise<void> {
    await AsyncStorage.setItem(ApiService.MEDICATIONS_CACHE_KEY, JSON.stringify(medications));
    await AsyncStorage.setItem(ApiService.CACHE_TIMESTAMP_KEY, Date.now().toString());
  }
  
  private async getCachedMedications(): Promise<Medication[] | null> {
    try {
      const cached = await AsyncStorage.getItem(ApiService.MEDICATIONS_CACHE_KEY);
      const timestamp = await AsyncStorage.getItem(ApiService.CACHE_TIMESTAMP_KEY);
      
      if (!cached || !timestamp) return null;
      
      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge > maxAge) return null;
      
      return JSON.parse(cached);
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }
  
  private async cacheSchedules(schedules: MedicationSchedule[]): Promise<void> {
    await AsyncStorage.setItem(ApiService.SCHEDULES_CACHE_KEY, JSON.stringify(schedules));
  }
  
  private async getCachedSchedules(): Promise<MedicationSchedule[] | null> {
    try {
      const cached = await AsyncStorage.getItem(ApiService.SCHEDULES_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Schedule cache read error:', error);
      return null;
    }
  }
  
  private async updateLogCache(log: MedicationLog): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(ApiService.LOGS_CACHE_KEY);
      const logs: MedicationLog[] = cached ? JSON.parse(cached) : [];
      
      logs.unshift(log); // Add to beginning
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(100);
      }
      
      await AsyncStorage.setItem(ApiService.LOGS_CACHE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Log cache update error:', error);
    }
  }
  
  private async queueOfflineAction(action: string, data: any): Promise<void> {
    try {
      const queueKey = 'offline_action_queue';
      const cached = await AsyncStorage.getItem(queueKey);
      const queue = cached ? JSON.parse(cached) : [];
      
      queue.push({
        action,
        data,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      });
      
      await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Queue offline action error:', error);
    }
  }
  
  async syncOfflineActions(): Promise<void> {
    try {
      const queueKey = 'offline_action_queue';
      const cached = await AsyncStorage.getItem(queueKey);
      if (!cached) return;
      
      const queue = JSON.parse(cached);
      const processedIds: string[] = [];
      
      for (const item of queue) {
        try {
          switch (item.action) {
            case 'log_medication':
              await this.logMedicationTaken(
                item.data.scheduleId,
                new Date(item.data.actualTime),
                item.data.notes
              );
              break;
            // Add other offline actions here
          }
          processedIds.push(item.id);
        } catch (error) {
          console.error(`Failed to sync offline action ${item.id}:`, error);
          // Keep failed items in queue for retry
        }
      }
      
      // Remove successfully processed items
      const remainingQueue = queue.filter((item: any) => !processedIds.includes(item.id));
      await AsyncStorage.setItem(queueKey, JSON.stringify(remainingQueue));
      
    } catch (error) {
      console.error('Sync offline actions error:', error);
    }
  }
  
  // Utility method to check network connectivity and sync
  async ensureSync(): Promise<void> {
    try {
      // Test connection with a lightweight request
      const response = await fetch(`${this.baseUrl}/api/health/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        await this.syncOfflineActions();
        // Refresh cache with latest data
        await this.getMedications(true);
        await this.getMedicationSchedules(true);
      }
    } catch (error) {
      console.log('Sync check failed - continuing offline:', (error as Error).message);
    }
  }
}

export default new ApiService();
