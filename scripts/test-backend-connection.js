// scripts/test-backend-connection.js
import { DEV_CONFIG } from '../src/config/development'

export const testBackendConnection = async () => {
  try {
    console.log('🔄 Testing backend connection...')

    // Test basic connectivity
    const healthCheck = await fetch(`${DEV_CONFIG.API_BASE_URL}/api/health/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!healthCheck.ok) {
      throw new Error(`Health check failed: ${healthCheck.status}`)
    }
    console.log('✅ Backend connectivity: OK')

    // Test Wagtail API
    const wagtailTest = await fetch(`${DEV_CONFIG.WAGTAIL_API_BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (wagtailTest.ok) {
      console.log('✅ Wagtail API connectivity: OK')
      // Best-effort: content may not be JSON root
      try {
        const wagtailData = await wagtailTest.json()
        console.log('📊 Wagtail API info:', wagtailData)
      } catch {}
    } else {
      console.log('⚠️  Wagtail API connectivity: Limited')
    }

    // Test medication endpoint
    const medicationTest = await fetch(`${DEV_CONFIG.API_BASE_URL}/api/medications/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (medicationTest.ok) {
      console.log('✅ Medications API: OK')
    } else {
      console.log('⚠️  Medications API: Requires authentication')
    }

    return {
      backend: healthCheck.ok,
      wagtail: wagtailTest.ok,
      medications: medicationTest.ok,
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error)
    return {
      backend: false,
      wagtail: false,
      medications: false,
      error: (error as Error).message,
    }
  }
}

// Usage in your app
export const initializeApp = async () => {
  if (__DEV__) {
    const connectionStatus = await testBackendConnection()
    if (!connectionStatus.backend) {
      console.warn('⚠️  Backend not available - running in offline mode')
    }
  }
}


