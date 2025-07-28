import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMedication, createSchedule } from '../types';
import { generateSchedule } from '../utils/scheduleUtils';

const MedicationContext = createContext();

export const useMedication = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedication must be used within a MedicationProvider');
  }
  return context;
};

export const MedicationProvider = ({ children }) => {
  const [medications, setMedications] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedMedications, savedSchedules] = await Promise.all([
        AsyncStorage.getItem('@medguard_medications'),
        AsyncStorage.getItem('@medguard_schedules'),
      ]);

      if (savedMedications) {
        const parsedMedications = JSON.parse(savedMedications).map(med => ({
          ...med,
          startDate: new Date(med.startDate),
          endDate: med.endDate ? new Date(med.endDate) : null,
          createdAt: new Date(med.createdAt),
          updatedAt: new Date(med.updatedAt),
        }));
        setMedications(parsedMedications);
      }

      if (savedSchedules) {
        const parsedSchedules = JSON.parse(savedSchedules).map(schedule => ({
          ...schedule,
          date: new Date(schedule.date),
          takenAt: schedule.takenAt ? new Date(schedule.takenAt) : null,
        }));
        setSchedules(parsedSchedules);
      }
    } catch (error) {
      console.error('Error loading medication data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem('@medguard_medications', JSON.stringify(medications)),
        AsyncStorage.setItem('@medguard_schedules', JSON.stringify(schedules)),
      ]);
    } catch (error) {
      console.error('Error saving medication data:', error);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [medications, schedules, isLoading]);

  const addMedication = async (medicationData) => {
    const newMedication = createMedication({
      ...medicationData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setMedications(prev => [...prev, newMedication]);

    // Generate schedules for the new medication
    const newSchedules = generateSchedule(newMedication);
    setSchedules(prev => [...prev, ...newSchedules]);

    return newMedication;
  };

  const updateMedication = async (id, updates) => {
    setMedications(prev => 
      prev.map(med => 
        med.id === id 
          ? { ...med, ...updates, updatedAt: new Date() }
          : med
      )
    );

    // Regenerate schedules if frequency or times changed
    if (updates.frequency || updates.times) {
      const updatedMedication = medications.find(med => med.id === id);
      if (updatedMedication) {
        const newSchedules = generateSchedule({ ...updatedMedication, ...updates });
        setSchedules(prev => [
          ...prev.filter(schedule => schedule.medicationId !== id),
          ...newSchedules,
        ]);
      }
    }
  };

  const deleteMedication = async (id) => {
    setMedications(prev => prev.filter(med => med.id !== id));
    setSchedules(prev => prev.filter(schedule => schedule.medicationId !== id));
  };

  const getTodaySchedules = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === today.getTime();
    });
  };

  const getUpcomingSchedules = (days = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate >= today && scheduleDate <= futureDate;
    });
  };

  const markDoseAsTaken = async (scheduleId, notes = '') => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, status: 'taken', takenAt: new Date(), notes }
          : schedule
      )
    );
  };

  const markDoseAsMissed = async (scheduleId) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, status: 'missed' }
          : schedule
      )
    );
  };

  const skipDose = async (scheduleId) => {
    setSchedules(prev => 
      prev.map(schedule => 
        schedule.id === scheduleId 
          ? { ...schedule, status: 'skipped' }
          : schedule
      )
    );
  };

  const updateStockLevel = async (medicationId, newQuantity) => {
    let newStockLevel = 'full';
    if (newQuantity <= 0) newStockLevel = 'empty';
    else if (newQuantity <= 7) newStockLevel = 'low';
    else if (newQuantity <= 14) newStockLevel = 'medium';

    setMedications(prev => 
      prev.map(med => 
        med.id === medicationId 
          ? { ...med, stockQuantity: newQuantity, stockLevel: newStockLevel, updatedAt: new Date() }
          : med
      )
    );
  };

  const getMedicationById = (id) => {
    return medications.find(med => med.id === id);
  };

  const getSchedulesByMedicationId = (medicationId) => {
    return schedules.filter(schedule => schedule.medicationId === medicationId);
  };

  const getLowStockMedications = () => {
    return medications.filter(med => med.stockLevel === 'low' || med.stockLevel === 'empty');
  };

  const exportData = async () => {
    return {
      medications,
      schedules,
      exportedAt: new Date().toISOString(),
    };
  };

  const importData = async (data) => {
    if (data.medications && data.schedules) {
      setMedications(data.medications.map(med => ({
        ...med,
        startDate: new Date(med.startDate),
        endDate: med.endDate ? new Date(med.endDate) : null,
        createdAt: new Date(med.createdAt),
        updatedAt: new Date(med.updatedAt),
      })));
      
      setSchedules(data.schedules.map(schedule => ({
        ...schedule,
        date: new Date(schedule.date),
        takenAt: schedule.takenAt ? new Date(schedule.takenAt) : null,
      })));
    }
  };

  const clearAllData = async () => {
    setMedications([]);
    setSchedules([]);
    await AsyncStorage.multiRemove(['@medguard_medications', '@medguard_schedules']);
  };

  const value = {
    medications,
    schedules,
    isLoading,
    addMedication,
    updateMedication,
    deleteMedication,
    getTodaySchedules,
    getUpcomingSchedules,
    markDoseAsTaken,
    markDoseAsMissed,
    skipDose,
    updateStockLevel,
    getMedicationById,
    getSchedulesByMedicationId,
    getLowStockMedications,
    exportData,
    importData,
    clearAllData,
  };

  return (
    <MedicationContext.Provider value={value}>
      {children}
    </MedicationContext.Provider>
  );
}; 