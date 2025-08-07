import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  instructions: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'completed' | 'discontinued';
  prescribedBy?: string;
  pharmacy?: string;
  prescriptionImage?: string;
  sideEffects?: string[];
  interactions?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  time: string; // HH:mm format
  days: string[]; // ['monday', 'tuesday', etc.]
  enabled: boolean;
  notificationId?: string;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  takenAt: string;
  dosage: string;
  notes?: string;
  createdAt: string;
}

export interface MedicationState {
  medications: Medication[];
  reminders: MedicationReminder[];
  logs: MedicationLog[];
  isLoading: boolean;
  error: string | null;
}

export interface MedicationContextType extends MedicationState {
  addMedication: (medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateMedication: (id: string, updates: Partial<Medication>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  getMedication: (id: string) => Medication | undefined;
  getActiveMedications: () => Medication[];
  addReminder: (reminder: Omit<MedicationReminder, 'id' | 'createdAt'>) => Promise<string>;
  updateReminder: (id: string, updates: Partial<MedicationReminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  getRemindersForMedication: (medicationId: string) => MedicationReminder[];
  logMedicationTaken: (medicationId: string, dosage: string, notes?: string) => Promise<string>;
  getMedicationLogs: (medicationId: string, days?: number) => MedicationLog[];
  checkDrugInteractions: (medicationIds: string[]) => Promise<string[]>;
  syncWithBackend: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

interface MedicationProviderProps {
  children: ReactNode;
}

export const MedicationProvider: React.FC<MedicationProviderProps> = ({ children }) => {
  const [state, setState] = useState<MedicationState>({
    medications: [],
    reminders: [],
    logs: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const [medications, reminders, logs] = await Promise.all([
        AsyncStorage.getItem('medications'),
        AsyncStorage.getItem('medication_reminders'),
        AsyncStorage.getItem('medication_logs'),
      ]);

      setState(prev => ({
        ...prev,
        medications: medications ? JSON.parse(medications) : [],
        reminders: reminders ? JSON.parse(reminders) : [],
        logs: logs ? JSON.parse(logs) : [],
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error loading medication data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load medication data',
        isLoading: false,
      }));
    }
  };

  const addMedication = async (
    medication: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    try {
      const id = `medication_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newMedication: Medication = {
        ...medication,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const updatedMedications = [...state.medications, newMedication];
      
      setState(prev => ({
        ...prev,
        medications: updatedMedications,
        error: null,
      }));

      await AsyncStorage.setItem('medications', JSON.stringify(updatedMedications));

      return id;
    } catch (error) {
      console.error('Error adding medication:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to add medication',
      }));
      throw error;
    }
  };

  const updateMedication = async (id: string, updates: Partial<Medication>): Promise<void> => {
    try {
      const updatedMedications = state.medications.map(medication =>
        medication.id === id
          ? { ...medication, ...updates, updatedAt: new Date().toISOString() }
          : medication
      );

      setState(prev => ({
        ...prev,
        medications: updatedMedications,
        error: null,
      }));

      await AsyncStorage.setItem('medications', JSON.stringify(updatedMedications));
    } catch (error) {
      console.error('Error updating medication:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update medication',
      }));
    }
  };

  const deleteMedication = async (id: string): Promise<void> => {
    try {
      // Remove medication
      const updatedMedications = state.medications.filter(medication => medication.id !== id);
      
      // Remove associated reminders
      const updatedReminders = state.reminders.filter(reminder => reminder.medicationId !== id);
      
      // Remove associated logs
      const updatedLogs = state.logs.filter(log => log.medicationId !== id);

      setState(prev => ({
        ...prev,
        medications: updatedMedications,
        reminders: updatedReminders,
        logs: updatedLogs,
        error: null,
      }));

      await Promise.all([
        AsyncStorage.setItem('medications', JSON.stringify(updatedMedications)),
        AsyncStorage.setItem('medication_reminders', JSON.stringify(updatedReminders)),
        AsyncStorage.setItem('medication_logs', JSON.stringify(updatedLogs)),
      ]);
    } catch (error) {
      console.error('Error deleting medication:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to delete medication',
      }));
    }
  };

  const getMedication = (id: string): Medication | undefined => {
    return state.medications.find(medication => medication.id === id);
  };

  const getActiveMedications = (): Medication[] => {
    return state.medications.filter(medication => medication.status === 'active');
  };

  const addReminder = async (
    reminder: Omit<MedicationReminder, 'id' | 'createdAt'>
  ): Promise<string> => {
    try {
      const id = `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newReminder: MedicationReminder = {
        ...reminder,
        id,
        createdAt: now,
      };

      const updatedReminders = [...state.reminders, newReminder];
      
      setState(prev => ({
        ...prev,
        reminders: updatedReminders,
        error: null,
      }));

      await AsyncStorage.setItem('medication_reminders', JSON.stringify(updatedReminders));

      return id;
    } catch (error) {
      console.error('Error adding reminder:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to add reminder',
      }));
      throw error;
    }
  };

  const updateReminder = async (id: string, updates: Partial<MedicationReminder>): Promise<void> => {
    try {
      const updatedReminders = state.reminders.map(reminder =>
        reminder.id === id ? { ...reminder, ...updates } : reminder
      );

      setState(prev => ({
        ...prev,
        reminders: updatedReminders,
        error: null,
      }));

      await AsyncStorage.setItem('medication_reminders', JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error updating reminder:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to update reminder',
      }));
    }
  };

  const deleteReminder = async (id: string): Promise<void> => {
    try {
      const updatedReminders = state.reminders.filter(reminder => reminder.id !== id);

      setState(prev => ({
        ...prev,
        reminders: updatedReminders,
        error: null,
      }));

      await AsyncStorage.setItem('medication_reminders', JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to delete reminder',
      }));
    }
  };

  const getRemindersForMedication = (medicationId: string): MedicationReminder[] => {
    return state.reminders.filter(reminder => reminder.medicationId === medicationId);
  };

  const logMedicationTaken = async (
    medicationId: string,
    dosage: string,
    notes?: string
  ): Promise<string> => {
    try {
      const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newLog: MedicationLog = {
        id,
        medicationId,
        takenAt: now,
        dosage,
        ...(notes && { notes }),
        createdAt: now,
      };

      const updatedLogs = [...state.logs, newLog];
      
      setState(prev => ({
        ...prev,
        logs: updatedLogs,
        error: null,
      }));

      await AsyncStorage.setItem('medication_logs', JSON.stringify(updatedLogs));

      return id;
    } catch (error) {
      console.error('Error logging medication:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to log medication',
      }));
      throw error;
    }
  };

  const getMedicationLogs = (medicationId: string, days?: number): MedicationLog[] => {
    let filteredLogs = state.logs.filter(log => log.medicationId === medicationId);

    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredLogs = filteredLogs.filter(log => new Date(log.takenAt) >= cutoffDate);
    }

    return filteredLogs.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
  };

  const checkDrugInteractions = async (medicationIds: string[]): Promise<string[]> => {
    try {
      // TODO: Implement actual drug interaction checking with backend API
      // For now, return mock interactions
      const interactions: string[] = [];
      
      if (medicationIds.length > 1) {
        interactions.push('Potential interaction detected between selected medications');
        interactions.push('Consult your healthcare provider for guidance');
      }

      return interactions;
    } catch (error) {
      console.error('Error checking drug interactions:', error);
      return ['Error checking drug interactions'];
    }
  };

  const syncWithBackend = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // TODO: Implement actual backend sync
      // This would typically involve:
      // 1. Fetching updated medication data from backend
      // 2. Sending local changes to backend
      // 3. Resolving conflicts
      // 4. Updating local storage

      console.log('Syncing with backend...');
      
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setState(prev => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      console.error('Error syncing with backend:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to sync with backend',
      }));
    }
  };

  const clearAllData = async (): Promise<void> => {
    try {
      setState({
        medications: [],
        reminders: [],
        logs: [],
        isLoading: false,
        error: null,
      });

      await Promise.all([
        AsyncStorage.removeItem('medications'),
        AsyncStorage.removeItem('medication_reminders'),
        AsyncStorage.removeItem('medication_logs'),
      ]);
    } catch (error) {
      console.error('Error clearing medication data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to clear data',
      }));
    }
  };

  const value: MedicationContextType = {
    ...state,
    addMedication,
    updateMedication,
    deleteMedication,
    getMedication,
    getActiveMedications,
    addReminder,
    updateReminder,
    deleteReminder,
    getRemindersForMedication,
    logMedicationTaken,
    getMedicationLogs,
    checkDrugInteractions,
    syncWithBackend,
    clearAllData,
  };

  return <MedicationContext.Provider value={value}>{children}</MedicationContext.Provider>;
};

export const useMedications = (): MedicationContextType => {
  const context = useContext(MedicationContext);
  if (context === undefined) {
    throw new Error('useMedications must be used within a MedicationProvider');
  }
  return context;
};
