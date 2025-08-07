/**
 * MedGuard SA - Schedule-related TypeScript interfaces
 * Shared types for schedule components and screens
 */

export interface MedicationSchedule {
  id: number;
  medication: any;
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

export interface ScheduledDose {
  id: string;
  scheduleId: number;
  medicationId: number;
  medicationName: string;
  dosageAmount: string;
  scheduledTime: Date;
  status: 'upcoming' | 'taken' | 'missed' | 'overdue';
  instructions?: string;
}
