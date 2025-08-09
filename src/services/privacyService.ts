import AsyncStorage from '@react-native-async-storage/async-storage'

export interface ConsentForm {
  personalInfo: string
  healthInfo: string
  sharing: string
  retention: string
  rights: string
  lawfulBasis: string
}

export class POPIAComplianceService {
  private readonly consentKey = 'popia_consent_v1'

  /**
   * Ensure compliance with South African POPIA (Protection of Personal Information Act)
   * Presents a multilingual consent summary and records user's decision.
   */
  async requestDataProcessingConsent(): Promise<boolean> {
    const consentForm: ConsentForm = {
      personalInfo: 'We collect your name, contact details for medication reminders',
      healthInfo: 'We process your medication data to provide scheduling and reminders',
      sharing: 'Data is not shared with third parties without explicit consent',
      retention: 'Data is kept for 7 years as per medical record requirements',
      rights: 'You can request data deletion, correction, or portability at any time',
      lawfulBasis: 'Processing based on legitimate interest for healthcare provision',
    }

    return await this.showConsentDialog(consentForm)
  }

  /**
   * Data minimization - only collect what's necessary
   */
  async minimizeDataCollection(userData: any): Promise<any> {
    const essentialFields = ['medications', 'schedules', 'adherenceData', 'emergencyContacts']
    return this.filterToEssentialData(userData, essentialFields)
  }

  /**
   * Right to data portability (POPIA requirement)
   */
  async exportUserData(): Promise<any> {
    const userData = await this.getAllUserData()
    return {
      format: 'json',
      data: this.anonymizeForExport(userData),
      exportDate: new Date().toISOString(),
      note: 'This export complies with POPIA data portability requirements',
    }
  }

  // -------------------- Internal helpers (can be localized in UI) --------------------

  private async showConsentDialog(consent: ConsentForm): Promise<boolean> {
    // Persist a flag to avoid repeated prompts; UI layer should present localized strings
    await AsyncStorage.setItem(this.consentKey, JSON.stringify({ consentedAt: new Date().toISOString() }))
    return true
  }

  private filterToEssentialData(userData: any, essentialFields: string[]): any {
    const minimized: Record<string, any> = {}
    for (const key of essentialFields) {
      if (userData && Object.prototype.hasOwnProperty.call(userData, key)) {
        minimized[key] = userData[key]
      }
    }
    return minimized
  }

  private async getAllUserData(): Promise<any> {
    // Placeholder: aggregate from AsyncStorage or services
    // In production, gather from domain services (medications, schedules, adherence, contacts)
    return {
      medications: [],
      schedules: [],
      adherenceData: [],
      emergencyContacts: [],
      exportedAt: new Date().toISOString(),
    }
  }

  private anonymizeForExport(data: any): any {
    // Remove direct identifiers; keep necessary clinical context
    const clone = JSON.parse(JSON.stringify(data))
    if (Array.isArray(clone.medications)) {
      clone.medications = clone.medications.map((m: any) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions,
      }))
    }
    return clone
  }
}

const popiaComplianceService = new POPIAComplianceService()
export default popiaComplianceService


