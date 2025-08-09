// src/config/development.js
export const DEV_CONFIG = {
  // Backend API Configuration
  API_BASE_URL: 'http://localhost:8000', // Development server
  WAGTAIL_API_BASE_URL: 'http://localhost:8000/api/v2',

  // Authentication Endpoints
  AUTH: {
    TOKEN_ENDPOINT: '/api/users/token/',
    REFRESH_ENDPOINT: '/api/users/refresh/',
    LOGOUT_ENDPOINT: '/api/users/logout/',
  },

  // Medication Endpoints
  MEDICATION: {
    LIST: '/api/medications/',
    DETAIL: '/api/medications/{id}/',
    SEARCH: '/api/medications/search/',
    CATEGORIES: '/api/medications/categories/',
  },

  // Wagtail Enhanced API Endpoints (from backend analysis)
  WAGTAIL_API: {
    PAGES: '/api/v2/pages/',
    IMAGES: '/api/v2/images/',
    DOCUMENTS: '/api/v2/documents/',
    SEARCH: '/api/v2/search/',
    MEDICATIONS: '/api/v2/medications/',
  },

  // Healthcare Integration
  HEALTHCARE: {
    PHARMACY_SEARCH: '/api/healthcare/pharmacies/',
    MEDICAL_AIDS: '/api/healthcare/medical-aids/',
    CLINIC_LOCATOR: '/api/healthcare/clinics/',
  },

  // Security & Compliance
  SECURITY: {
    AUDIT_LOG: '/api/security/audit/',
    PRIVACY_SETTINGS: '/api/privacy/settings/',
    DATA_EXPORT: '/api/privacy/export/',
  },

  // Development Settings
  DEBUG: true,
  LOG_LEVEL: 'debug',
  ENABLE_DEV_TOOLS: true,
}


