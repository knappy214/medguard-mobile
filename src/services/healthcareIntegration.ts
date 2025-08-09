/**
 * SouthAfricanHealthcareService
 * 
 * Lightweight integrations and helpers for South African healthcare context:
 * - Medical aid (scheme) validation
 * - Nearby pharmacy suggestions (common national chains)
 * - Chronic benefit heuristics for common chronic conditions
 */
export interface GeoLocation {
  lat: number
  lng: number
  city?: string
  province?: string
}

export interface Pharmacy {
  name: string
  chain: 'clicks' | 'dischem' | 'pnp' | 'independent'
  location: GeoLocation
  hours: string // HH:MM-HH:MM
}

export interface GPPractice {
  name: string
  network: 'netcare' | 'life_healthcare' | 'medicross' | 'independent'
  location: GeoLocation
  hours: string // HH:MM-HH:MM
  phone?: string
}

export interface MedicationLike {
  indication?: string
  scheduleLevel?: number
}

export interface MedicalAidLike {
  schemeCode: string
  memberNumber: string
}

export interface ChronicBenefitResult {
  isChronicMedication: boolean
  copayment: number
  requiresAuthorization: boolean
}

export class SouthAfricanHealthcareService {
  /**
   * Validate a medical aid (scheme) code against known SA schemes (heuristic list).
   */
  async validateMedicalAid(schemeCode: string, memberNumber: string): Promise<boolean> {
    const validSchemes = [
      'DISC001', // Discovery Health
      'MOME001', // Momentum Health
      'BONI001', // Bonitas
      'GEMS001', // GEMS
      // Add more SA medical scheme codes
    ]

    return validSchemes.includes(schemeCode)
  }

  /**
   * Suggest nearby pharmacies based on common national chains.
   * Replace later with actual provider/location API.
   */
  async findNearbyPharmacies(location: GeoLocation): Promise<Pharmacy[]> {
    return [
      { name: 'Clicks Pharmacy', chain: 'clicks', location, hours: '08:00-20:00' },
      { name: 'Dis-Chem Pharmacy', chain: 'dischem', location, hours: '08:00-21:00' },
      { name: 'Pick n Pay Pharmacy', chain: 'pnp', location, hours: '09:00-18:00' },
      // Add provincial clinic integration
    ]
  }

  /**
   * Suggest nearby GP practices/clinics for out-of-town assistance.
   */
  async findNearbyGPs(location: GeoLocation): Promise<GPPractice[]> {
    return [
      { name: 'Medicross Family Medical & Dental Centre', network: 'medicross', location, hours: '08:00-18:00', phone: '+27110000001' },
      { name: 'Netcare GP Practice', network: 'netcare', location, hours: '08:00-17:00', phone: '+27110000002' },
      { name: 'Life Healthcare GP Clinic', network: 'life_healthcare', location, hours: '09:00-17:00', phone: '+27110000003' },
    ]
  }

  /**
   * Determine if medication is typically covered under Chronic Benefit.
   */
  async checkChronicBenefit(medication: MedicationLike, medicalAid: MedicalAidLike): Promise<ChronicBenefitResult> {
    const chronicConditions = [
      'diabetes',
      'hypertension',
      'asthma',
      'epilepsy',
      'chronic_heart_failure',
      'chronic_renal_disease'
    ]

    const indication = (medication.indication || '').toLowerCase()
    const isChronicMedication = chronicConditions.some((condition) => indication.includes(condition))

    return {
      isChronicMedication,
      copayment: 0, // Chronic medications are usually covered 100%
      requiresAuthorization: (medication.scheduleLevel || 0) >= 4,
    }
  }
}

const saHealthcareService = new SouthAfricanHealthcareService()
export default saHealthcareService


