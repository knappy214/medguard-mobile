import { createSchedule, FREQUENCY_TYPES, TIME_PERIODS } from '../types';

// Default times for different periods
const DEFAULT_TIMES = {
  [TIME_PERIODS.MORNING]: '08:00',
  [TIME_PERIODS.AFTERNOON]: '12:00',
  [TIME_PERIODS.EVENING]: '18:00',
  [TIME_PERIODS.NIGHT]: '22:00',
  [TIME_PERIODS.BEDTIME]: '21:00',
};

// Generate schedules for a medication based on its frequency and times
export const generateSchedule = (medication) => {
  const schedules = [];
  const startDate = new Date(medication.startDate);
  const endDate = medication.endDate ? new Date(medication.endDate) : null;
  
  // Generate schedules for the next 90 days or until end date
  const maxDate = endDate || new Date();
  maxDate.setDate(maxDate.getDate() + 90);

  let currentDate = new Date(startDate);
  
  while (currentDate <= maxDate) {
    const daySchedules = generateDaySchedules(medication, currentDate);
    schedules.push(...daySchedules);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedules;
};

// Generate schedules for a specific day
const generateDaySchedules = (medication, date) => {
  const schedules = [];
  const { frequency, times } = medication;

  switch (frequency) {
    case FREQUENCY_TYPES.DAILY:
      schedules.push(...generateDailySchedules(medication, date, times));
      break;
    case FREQUENCY_TYPES.TWICE_DAILY:
      schedules.push(...generateTwiceDailySchedules(medication, date, times));
      break;
    case FREQUENCY_TYPES.THREE_TIMES_DAILY:
      schedules.push(...generateThreeTimesDailySchedules(medication, date, times));
      break;
    case FREQUENCY_TYPES.FOUR_TIMES_DAILY:
      schedules.push(...generateFourTimesDailySchedules(medication, date, times));
      break;
    case FREQUENCY_TYPES.WEEKLY:
      if (isWeeklyDay(date, medication.startDate)) {
        schedules.push(...generateDailySchedules(medication, date, times));
      }
      break;
    case FREQUENCY_TYPES.CUSTOM:
      schedules.push(...generateCustomSchedules(medication, date, times));
      break;
    default:
      break;
  }

  return schedules;
};

// Generate daily schedules
const generateDailySchedules = (medication, date, times) => {
  const schedules = [];
  
  if (times && times.length > 0) {
    times.forEach(time => {
      schedules.push(createSchedule({
        id: `${medication.id}_${date.toISOString().split('T')[0]}_${time}`,
        medicationId: medication.id,
        date: new Date(date),
        time: time,
        status: 'pending',
      }));
    });
  } else {
    // Default to morning if no times specified
    schedules.push(createSchedule({
      id: `${medication.id}_${date.toISOString().split('T')[0]}_${DEFAULT_TIMES[TIME_PERIODS.MORNING]}`,
      medicationId: medication.id,
      date: new Date(date),
      time: DEFAULT_TIMES[TIME_PERIODS.MORNING],
      status: 'pending',
    }));
  }

  return schedules;
};

// Generate twice daily schedules
const generateTwiceDailySchedules = (medication, date, times) => {
  const schedules = [];
  
  if (times && times.length >= 2) {
    times.slice(0, 2).forEach(time => {
      schedules.push(createSchedule({
        id: `${medication.id}_${date.toISOString().split('T')[0]}_${time}`,
        medicationId: medication.id,
        date: new Date(date),
        time: time,
        status: 'pending',
      }));
    });
  } else {
    // Default to morning and evening
    const defaultTimes = [DEFAULT_TIMES[TIME_PERIODS.MORNING], DEFAULT_TIMES[TIME_PERIODS.EVENING]];
    defaultTimes.forEach(time => {
      schedules.push(createSchedule({
        id: `${medication.id}_${date.toISOString().split('T')[0]}_${time}`,
        medicationId: medication.id,
        date: new Date(date),
        time: time,
        status: 'pending',
      }));
    });
  }

  return schedules;
};

// Generate three times daily schedules
const generateThreeTimesDailySchedules = (medication, date, times) => {
  const schedules = [];
  
  if (times && times.length >= 3) {
    times.slice(0, 3).forEach(time => {
      schedules.push(createSchedule({
        id: `${medication.id}_${date.toISOString().split('T')[0]}_${time}`,
        medicationId: medication.id,
        date: new Date(date),
        time: time,
        status: 'pending',
      }));
    });
  } else {
    // Default to morning, afternoon, and evening
    const defaultTimes = [
      DEFAULT_TIMES[TIME_PERIODS.MORNING],
      DEFAULT_TIMES[TIME_PERIODS.AFTERNOON],
      DEFAULT_TIMES[TIME_PERIODS.EVENING]
    ];
    defaultTimes.forEach(time => {
      schedules.push(createSchedule({
        id: `${medication.id}_${date.toISOString().split('T')[0]}_${time}`,
        medicationId: medication.id,
        date: new Date(date),
        time: time,
        status: 'pending',
      }));
    });
  }

  return schedules;
};

// Generate four times daily schedules
const generateFourTimesDailySchedules = (medication, date, times) => {
  const schedules = [];
  
  if (times && times.length >= 4) {
    times.slice(0, 4).forEach(time => {
      schedules.push(createSchedule({
        id: `${medication.id}_${date.toISOString().split('T')[0]}_${time}`,
        medicationId: medication.id,
        date: new Date(date),
        time: time,
        status: 'pending',
      }));
    });
  } else {
    // Default to morning, afternoon, evening, and bedtime
    const defaultTimes = [
      DEFAULT_TIMES[TIME_PERIODS.MORNING],
      DEFAULT_TIMES[TIME_PERIODS.AFTERNOON],
      DEFAULT_TIMES[TIME_PERIODS.EVENING],
      DEFAULT_TIMES[TIME_PERIODS.BEDTIME]
    ];
    defaultTimes.forEach(time => {
      schedules.push(createSchedule({
        id: `${medication.id}_${date.toISOString().split('T')[0]}_${time}`,
        medicationId: medication.id,
        date: new Date(date),
        time: time,
        status: 'pending',
      }));
    });
  }

  return schedules;
};

// Generate custom schedules
const generateCustomSchedules = (medication, date, times) => {
  const schedules = [];
  
  if (times && times.length > 0) {
    times.forEach(time => {
      schedules.push(createSchedule({
        id: `${medication.id}_${date.toISOString().split('T')[0]}_${time}`,
        medicationId: medication.id,
        date: new Date(date),
        time: time,
        status: 'pending',
      }));
    });
  }

  return schedules;
};

// Check if it's a weekly day (same day of week as start date)
const isWeeklyDay = (date, startDate) => {
  const startDay = new Date(startDate).getDay();
  const currentDay = date.getDay();
  return startDay === currentDay;
};

// Get time period from time string
export const getTimePeriod = (time) => {
  const hour = parseInt(time.split(':')[0]);
  
  if (hour >= 5 && hour < 12) return TIME_PERIODS.MORNING;
  if (hour >= 12 && hour < 17) return TIME_PERIODS.AFTERNOON;
  if (hour >= 17 && hour < 21) return TIME_PERIODS.EVENING;
  if (hour >= 21 || hour < 5) return TIME_PERIODS.NIGHT;
  
  return TIME_PERIODS.MORNING;
};

// Format time for display
export const formatTime = (time) => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

// Get next dose time
export const getNextDoseTime = (schedules) => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter today's pending schedules
  const todaySchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate.getTime() === today.getTime() && schedule.status === 'pending';
  });
  
  if (todaySchedules.length === 0) return null;
  
  // Find the next scheduled time
  const nextSchedule = todaySchedules.find(schedule => {
    const [hours, minutes] = schedule.time.split(':');
    const scheduleTime = new Date();
    scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return scheduleTime > now;
  });
  
  return nextSchedule ? nextSchedule.time : todaySchedules[0].time;
};

// Get missed doses for today
export const getMissedDoses = (schedules) => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    scheduleDate.setHours(0, 0, 0, 0);
    
    if (scheduleDate.getTime() !== today.getTime()) return false;
    
    const [hours, minutes] = schedule.time.split(':');
    const scheduleTime = new Date();
    scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return schedule.status === 'pending' && scheduleTime < now;
  });
}; 