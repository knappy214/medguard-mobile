// Simplified NotificationService for Expo Go compatibility
class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.expoPushToken = null;
    console.log('NotificationService: Running in Expo Go - notifications disabled');
  }

  async initialize() {
    if (this.isInitialized) return;
    console.log('NotificationService: Initialization skipped for Expo Go');
    this.isInitialized = true;
  }

  async setupAndroidChannel() {
    console.log('Android channel setup disabled in Expo Go');
  }

  async registerForPushNotifications() {
    console.log('Push notification registration disabled in Expo Go');
    return null;
  }

  async scheduleMedicationReminder(medication, schedule, reminderMinutes = 15) {
    console.log('Medication reminder scheduling disabled in Expo Go');
    return null;
  }

  async scheduleLowStockAlert(medication) {
    console.log('Low stock alert scheduling disabled in Expo Go');
    return null;
  }

  async scheduleRefillReminder(medication, daysUntilRefill) {
    console.log('Refill reminder scheduling disabled in Expo Go');
    return null;
  }

  async scheduleDailyReminder(hour, minute) {
    console.log('Daily reminder scheduling disabled in Expo Go');
    return null;
  }

  async cancelNotification(notificationId) {
    console.log('Notification cancellation disabled in Expo Go');
    return false;
  }

  async cancelAllNotifications() {
    console.log('All notifications cancellation disabled in Expo Go');
    return false;
  }

  async cancelNotificationsByType(type) {
    console.log('Notifications cancellation by type disabled in Expo Go');
    return false;
  }

  async getScheduledNotifications() {
    console.log('Getting scheduled notifications disabled in Expo Go');
    return [];
  }

  async getNotificationPermissions() {
    console.log('Getting notification permissions disabled in Expo Go');
    return { status: 'denied' };
  }

  async requestPermissions() {
    console.log('Requesting notification permissions disabled in Expo Go');
    return { status: 'denied' };
  }

  async addNotificationReceivedListener(callback) {
    console.log('Adding notification listeners disabled in Expo Go');
    return { remove: () => {} };
  }

  async addNotificationResponseReceivedListener(callback) {
    console.log('Adding notification response listeners disabled in Expo Go');
    return { remove: () => {} };
  }

  // Utility methods
  getExpoPushToken() {
    return this.expoPushToken;
  }

  isDevice() {
    return true; // Assume device for Expo Go
  }

  getPlatform() {
    return 'ios'; // Default platform
  }
}

export default new NotificationService(); 