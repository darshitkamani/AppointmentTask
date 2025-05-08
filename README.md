# Appointment Booking System

A React Native mobile application for managing appointments between patients and healthcare providers.

## Features

### User Features
1. **Appointment Form**:
   * Patient information collection:
     * Patient Name
     * Contact Number
     * Appointment Date (Calendar picker)
     * Appointment Time (1-hour slots with double-booking prevention)
     * Reason for Booking (select from predefined options)
   * Post-submission flow:
     * "Thank You" screen after successful submission
     * Feedback rating option (1-5 stars)

2. **Appointment Management**:
   * View all upcoming appointments
   * Receive reminders:
     * 1 day before appointment
     * 2 hours before appointment
   * Modify existing appointment details

### Admin Features
1. **Appointment Dashboard**:
   * Complete appointment overview
   * Approve or deny appointment change requests
   * Update appointment statuses (Cancelled, Done)
   * Access analytics on feedback ratings (average and total)

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation Steps

1. Clone the repository
```bash
git clone https://github.com/darshitkamani/AppointmentTask
cd AppointmentTask
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the Metro server
```bash
npm start
# or
yarn start
```

4. Run on Android
```bash
npm run android
# or
yarn android
```

5. Run on iOS (macOS only)
```bash
npm run ios
# or
yarn ios
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Card.tsx
│   ├── CustomButton.tsx
│   ├── CustomInput.tsx
│   ├── CustomPicker.tsx
│   └── StarRating.tsx
├── constants/         # App-wide constants
│   └── theme.ts       # Theme-related constants
├── navigation/        # Navigation configuration
│   ├── AdminStack.tsx
│   ├── RootNavigator.tsx
│   └── UserStack.tsx
├── screens/           # Application screens
│   ├── Admin/
│   │   └── AdminDashboardScreen.tsx
│   └── User/
│       ├── AppointmentFormScreen.tsx
│       ├── AppointmentListScreen.tsx
│       ├── EditAppointmentScreen.tsx
│       ├── HomeScreen.tsx
│       └── ThankYouScreen.tsx
└── utils/             # Utility functions
    ├── database.ts    # Database operations
    ├── formatters.ts  # Data formatting utilities
    ├── notification.ts # Notification handling
```
