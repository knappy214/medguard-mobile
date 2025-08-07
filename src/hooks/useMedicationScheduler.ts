/**
 * MedGuard SA - Medication Scheduler Hook
 * Smart scheduling logic for medication reminders and adherence tracking
 * Handles complex scheduling patterns and conflicts
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { addDays, addWeeks, addMonths, format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { useMedications } from '../contexts/MedicationContext';
import { useNotifications } from '../contexts/NotificationContext';
import notificationService from '../services/notificationService';

export interface SchedulePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'interval' | 'as_needed';
  interval?: number; // For interval type (e.g., every 8 hours)
  daysOfWeek?: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  daysOfMonth?: number[]; // [1, 15] for 1st and 15th
  times: string[]; // ["08:00", "12:00", "20:00"]
  duration?: number; // Duration in days
  endDate?: Date;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  pattern: SchedulePattern;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  instructions?: string;
  foodRequirement?: 'with_food' | 'without_food' | 'empty_stomach' | 'any';
  specialInstructions?: string[];
}

export interface ScheduledDose {
  id: string;
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  scheduledTime: Date;
  actualTime?: Date;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  notes?: string;
  snoozeCount: number;
  remindersSent: number;
  isOverdue: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface AdherenceStats {
  totalScheduledDoses: number;
  takenDoses: number;
  missedDoses: number;
  skippedDoses: number;
  adherenceRate: number;
  streak: number; // Current streak of taken doses
  longestStreak: number;
  weeklyAdherence: number[];
  monthlyAdherence: number[];
}

export interface SchedulerConfig {
  lookAheadDays: number;
  maxSnoozes: number;
  reminderIntervals: number[]; // Minutes before dose time
  conflictDetection: boolean;
  smartScheduling: boolean;
  adherenceTracking: boolean;
}

const defaultConfig: SchedulerConfig = {
  lookAheadDays: 30,
  maxSnoozes: 3,
  reminderIntervals: [15, 5, 0], // 15 min, 5 min, at time
  conflictDetection: true,
  smartScheduling: true,
  adherenceTracking: true,
};

export const useMedicationScheduler = (config: Partial<SchedulerConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const { medications } = useMedications();
  const { scheduleNotification, cancelNotification } = useNotifications();

  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [upcomingDoses, setUpcomingDoses] = useState<ScheduledDose[]>([]);
  const [adherenceStats, setAdherenceStats] = useState<AdherenceStats>({
    totalScheduledDoses: 0,
    takenDoses: 0,
    missedDoses: 0,
    skippedDoses: 0,
    adherenceRate: 0,
    streak: 0,
    longestStreak: 0,
    weeklyAdherence: [],
    monthlyAdherence: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Generate scheduled doses based on patterns
  const generateScheduledDoses = useCallback((
    schedule: MedicationSchedule,
    startDate: Date,
    endDate: Date
  ): ScheduledDose[] => {
    const doses: ScheduledDose[] = [];
    const { pattern } = schedule;
    
    let currentDate = startOfDay(startDate);
    const finalEndDate = endOfDay(schedule.endDate || endDate);

    while (currentDate <= finalEndDate) {
      let shouldSchedule = false;
      
      switch (pattern.type) {
        case 'daily':
          shouldSchedule = true;
          break;
          
        case 'weekly':
          if (pattern.daysOfWeek) {
            const dayOfWeek = currentDate.getDay();
            shouldSchedule = pattern.daysOfWeek[dayOfWeek];
          }
          break;
          
        case 'monthly':
          if (pattern.daysOfMonth) {
            const dayOfMonth = currentDate.getDate();
            shouldSchedule = pattern.daysOfMonth.includes(dayOfMonth);
          }
          break;
          
        case 'interval':
          if (pattern.interval) {
            const daysSinceStart = Math.floor(
              (currentDate.getTime() - startOfDay(schedule.startDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            shouldSchedule = daysSinceStart % pattern.interval === 0;
          }
          break;
          
        case 'as_needed':
          // As-needed medications are not automatically scheduled
          shouldSchedule = false;
          break;
      }

      if (shouldSchedule) {
        pattern.times.forEach((timeStr, timeIndex) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const scheduledTime = new Date(currentDate);
          scheduledTime.setHours(hours, minutes, 0, 0);

          // Skip past times
          if (scheduledTime > new Date()) {
            doses.push({
              id: `${schedule.id}-${format(scheduledTime, 'yyyy-MM-dd-HH-mm')}`,
              scheduleId: schedule.id,
              medicationId: schedule.medicationId,
              medicationName: schedule.medicationName,
              dosage: schedule.dosage,
              scheduledTime,
              status: 'pending',
              snoozeCount: 0,
              remindersSent: 0,
              isOverdue: false,
              priority: schedule.priority,
            });
          }
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    return doses.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }, []);

  // Create a new medication schedule
  const createSchedule = useCallback(async (schedule: Omit<MedicationSchedule, 'id'>): Promise<string> => {
    const id = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSchedule: MedicationSchedule = { ...schedule, id };
    
    setSchedules(prev => [...prev, newSchedule]);
    
    // Generate upcoming doses
    const endDate = addDays(new Date(), finalConfig.lookAheadDays);
    const doses = generateScheduledDoses(newSchedule, schedule.startDate, endDate);
    
    setUpcomingDoses(prev => {
      const filtered = prev.filter(dose => dose.scheduleId !== id);
      return [...filtered, ...doses].sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    });
    
    // Schedule notifications
    await scheduleNotificationsForDoses(doses);
    
    return id;
  }, [finalConfig.lookAheadDays, generateScheduledDoses]);

  // Update an existing schedule
  const updateSchedule = useCallback(async (
    scheduleId: string,
    updates: Partial<MedicationSchedule>
  ): Promise<void> => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, ...updates }
        : schedule
    ));
    
    // Regenerate doses for updated schedule
    const updatedSchedule = schedules.find(s => s.id === scheduleId);
    if (updatedSchedule) {
      const endDate = addDays(new Date(), finalConfig.lookAheadDays);
      const newDoses = generateScheduledDoses(
        { ...updatedSchedule, ...updates },
        updatedSchedule.startDate,
        endDate
      );
      
      setUpcomingDoses(prev => {
        const filtered = prev.filter(dose => dose.scheduleId !== scheduleId);
        return [...filtered, ...newDoses].sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
      });
      
      await scheduleNotificationsForDoses(newDoses);
    }
  }, [schedules, finalConfig.lookAheadDays, generateScheduledDoses]);

  // Delete a schedule
  const deleteSchedule = useCallback(async (scheduleId: string): Promise<void> => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    
    // Remove associated doses
    const dosesToCancel = upcomingDoses.filter(dose => dose.scheduleId === scheduleId);
    
    setUpcomingDoses(prev => prev.filter(dose => dose.scheduleId !== scheduleId));
    
    // Cancel associated notifications
    for (const dose of dosesToCancel) {
      await cancelNotification(dose.id);
    }
  }, [upcomingDoses, cancelNotification]);

  // Schedule notifications for doses
  const scheduleNotificationsForDoses = useCallback(async (doses: ScheduledDose[]): Promise<void> => {
    for (const dose of doses) {
      // Schedule multiple reminders based on config
      for (const minutesBefore of finalConfig.reminderIntervals) {
        const notificationTime = new Date(dose.scheduledTime.getTime() - minutesBefore * 60 * 1000);
        
        if (notificationTime > new Date()) {
          const title = minutesBefore === 0 
            ? `Time for ${dose.medicationName}`
            : `${dose.medicationName} reminder`;
          
          const body = minutesBefore === 0
            ? `Take your ${dose.dosage} dose now`
            : `Take your ${dose.dosage} dose in ${minutesBefore} minutes`;

          await scheduleNotification({
            title,
            body,
            scheduledDate: notificationTime,
            type: 'medication_reminder',
            priority: dose.priority === 'critical' ? 'high' : 'default',
            data: {
              doseId: dose.id,
              medicationId: dose.medicationId,
              scheduleId: dose.scheduleId,
              minutesBefore,
              screen: 'MedicationDetail',
              params: { medicationId: dose.medicationId },
            },
          });
        }
      }
    }
  }, [finalConfig.reminderIntervals, scheduleNotification]);

  // Mark a dose as taken
  const markDoseTaken = useCallback(async (
    doseId: string,
    actualTime: Date = new Date(),
    notes?: string
  ): Promise<void> => {
    setUpcomingDoses(prev => prev.map(dose =>
      dose.id === doseId
        ? { ...dose, status: 'taken', actualTime, notes }
        : dose
    ));
    
    // Update adherence stats
    calculateAdherenceStats();
  }, []);

  // Mark a dose as missed
  const markDoseMissed = useCallback(async (doseId: string, notes?: string): Promise<void> => {
    setUpcomingDoses(prev => prev.map(dose =>
      dose.id === doseId
        ? { ...dose, status: 'missed', notes }
        : dose
    ));
    
    calculateAdherenceStats();
  }, []);

  // Mark a dose as skipped
  const markDoseSkipped = useCallback(async (doseId: string, notes?: string): Promise<void> => {
    setUpcomingDoses(prev => prev.map(dose =>
      dose.id === doseId
        ? { ...dose, status: 'skipped', notes }
        : dose
    ));
    
    calculateAdherenceStats();
  }, []);

  // Snooze a dose
  const snoozeDose = useCallback(async (
    doseId: string,
    snoozeMinutes: number = 15
  ): Promise<boolean> => {
    const dose = upcomingDoses.find(d => d.id === doseId);
    if (!dose || dose.snoozeCount >= finalConfig.maxSnoozes) {
      return false;
    }
    
    const newScheduledTime = new Date(dose.scheduledTime.getTime() + snoozeMinutes * 60 * 1000);
    
    setUpcomingDoses(prev => prev.map(d =>
      d.id === doseId
        ? { ...d, scheduledTime: newScheduledTime, snoozeCount: d.snoozeCount + 1 }
        : d
    ));
    
    // Schedule new notification
    await scheduleNotification({
      title: `Snoozed: ${dose.medicationName}`,
      body: `Take your ${dose.dosage} dose now`,
      scheduledDate: newScheduledTime,
      type: 'medication_reminder',
      priority: dose.priority === 'critical' ? 'high' : 'default',
      data: {
        doseId: dose.id,
        medicationId: dose.medicationId,
        scheduleId: dose.scheduleId,
        minutesBefore: 0,
        snoozed: true,
      },
    });
    
    return true;
  }, [upcomingDoses, finalConfig.maxSnoozes, scheduleNotification]);

  // Calculate adherence statistics
  const calculateAdherenceStats = useCallback(() => {
    const now = new Date();
    const thirtyDaysAgo = addDays(now, -30);
    
    const recentDoses = upcomingDoses.filter(dose => 
      dose.scheduledTime >= thirtyDaysAgo && 
      dose.scheduledTime <= now
    );
    
    const totalScheduledDoses = recentDoses.length;
    const takenDoses = recentDoses.filter(dose => dose.status === 'taken').length;
    const missedDoses = recentDoses.filter(dose => dose.status === 'missed').length;
    const skippedDoses = recentDoses.filter(dose => dose.status === 'skipped').length;
    
    const adherenceRate = totalScheduledDoses > 0 ? (takenDoses / totalScheduledDoses) * 100 : 0;
    
    // Calculate streak
    let streak = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    
    const sortedDoses = recentDoses
      .filter(dose => dose.status !== 'pending')
      .sort((a, b) => b.scheduledTime.getTime() - a.scheduledTime.getTime());
    
    for (const dose of sortedDoses) {
      if (dose.status === 'taken') {
        currentStreak++;
        if (streak === 0) streak = currentStreak; // Current streak from most recent
      } else {
        if (currentStreak > longestStreak) longestStreak = currentStreak;
        currentStreak = 0;
      }
    }
    
    if (currentStreak > longestStreak) longestStreak = currentStreak;
    
    // Calculate weekly adherence for last 4 weeks
    const weeklyAdherence: number[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = addWeeks(now, -(i + 1));
      const weekEnd = addWeeks(now, -i);
      const weekDoses = recentDoses.filter(dose =>
        dose.scheduledTime >= weekStart && dose.scheduledTime < weekEnd
      );
      const weekTaken = weekDoses.filter(dose => dose.status === 'taken').length;
      const weekRate = weekDoses.length > 0 ? (weekTaken / weekDoses.length) * 100 : 0;
      weeklyAdherence.unshift(weekRate);
    }
    
    setAdherenceStats({
      totalScheduledDoses,
      takenDoses,
      missedDoses,
      skippedDoses,
      adherenceRate,
      streak,
      longestStreak,
      weeklyAdherence,
      monthlyAdherence: [], // Could be implemented similarly
    });
  }, [upcomingDoses]);

  // Get upcoming doses (next 24 hours)
  const getUpcomingDoses = useCallback((hours: number = 24): ScheduledDose[] => {
    const now = new Date();
    const futureTime = addDays(now, hours / 24);
    
    return upcomingDoses
      .filter(dose => 
        dose.status === 'pending' && 
        dose.scheduledTime >= now && 
        dose.scheduledTime <= futureTime
      )
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }, [upcomingDoses]);

  // Get overdue doses
  const getOverdueDoses = useCallback((): ScheduledDose[] => {
    const now = new Date();
    
    return upcomingDoses
      .filter(dose => 
        dose.status === 'pending' && 
        dose.scheduledTime < now
      )
      .map(dose => ({ ...dose, isOverdue: true }))
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }, [upcomingDoses]);

  // Detect scheduling conflicts
  const detectConflicts = useCallback((): Array<{
    time: Date;
    doses: ScheduledDose[];
    severity: 'low' | 'medium' | 'high';
  }> => {
    if (!finalConfig.conflictDetection) return [];
    
    const conflicts: Array<{ time: Date; doses: ScheduledDose[]; severity: 'low' | 'medium' | 'high' }> = [];
    const timeGroups = new Map<string, ScheduledDose[]>();
    
    // Group doses by time (within 15-minute windows)
    upcomingDoses
      .filter(dose => dose.status === 'pending')
      .forEach(dose => {
        const timeKey = format(dose.scheduledTime, 'yyyy-MM-dd-HH');
        const quarterHour = Math.floor(dose.scheduledTime.getMinutes() / 15) * 15;
        const adjustedTimeKey = `${timeKey}-${quarterHour}`;
        
        if (!timeGroups.has(adjustedTimeKey)) {
          timeGroups.set(adjustedTimeKey, []);
        }
        timeGroups.get(adjustedTimeKey)!.push(dose);
      });
    
    // Identify conflicts
    timeGroups.forEach((doses, timeKey) => {
      if (doses.length > 1) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        
        // Check for high-priority medications
        if (doses.some(dose => dose.priority === 'critical')) {
          severity = 'high';
        } else if (doses.some(dose => dose.priority === 'high')) {
          severity = 'medium';
        }
        
        // Check for food requirements conflicts
        const foodRequirements = doses.map(dose => {
          const schedule = schedules.find(s => s.id === dose.scheduleId);
          return schedule?.foodRequirement || 'any';
        });
        
        const hasConflictingFoodReqs = new Set(foodRequirements.filter(req => req !== 'any')).size > 1;
        if (hasConflictingFoodReqs) {
          severity = severity === 'low' ? 'medium' : 'high';
        }
        
        conflicts.push({
          time: doses[0].scheduledTime,
          doses,
          severity,
        });
      }
    });
    
    return conflicts.sort((a, b) => a.time.getTime() - b.time.getTime());
  }, [upcomingDoses, schedules, finalConfig.conflictDetection]);

  // Update overdue status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setUpcomingDoses(prev => prev.map(dose => ({
        ...dose,
        isOverdue: dose.status === 'pending' && dose.scheduledTime < now,
      })));
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Recalculate adherence stats when doses change
  useEffect(() => {
    calculateAdherenceStats();
  }, [upcomingDoses, calculateAdherenceStats]);

  return {
    // State
    schedules,
    upcomingDoses,
    adherenceStats,
    isLoading,
    
    // Schedule management
    createSchedule,
    updateSchedule,
    deleteSchedule,
    
    // Dose management
    markDoseTaken,
    markDoseMissed,
    markDoseSkipped,
    snoozeDose,
    
    // Queries
    getUpcomingDoses,
    getOverdueDoses,
    detectConflicts,
    
    // Utilities
    generateScheduledDoses,
    calculateAdherenceStats,
  };
};
