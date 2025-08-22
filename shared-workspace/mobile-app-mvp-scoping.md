# Mobile App MVP Scoping Document

This document outlines the comprehensive scope for the initial Mobile App (iOS & Android) MVP, designed for rapid development and deployment to validate core functionalities and user acceptance.

## 1. Core Features

*   **User Authentication & Profile Management**: Secure login for family members (NRI and local), basic profile setup, and password recovery.
*   **Emergency Alert Triggering**: One-tap emergency button for seniors (via linked device/interface) and family members to alert operations center and designated contacts.
*   **Real-time Health Status View**: Read-only display of key health indicators (e.g., 'Stable', 'Needs Attention', 'Alert') pulled from integrated AI/ML systems.
*   **Caregiver Communication**: Secure in-app messaging and voice note exchange with assigned caregivers.
*   **Family Communication Hub**: Group chat functionality for family members to coordinate care and share updates.
*   **Activity & Wellness Log**: View daily activities, medication adherence, and general well-being updates from caregivers.
*   **Notification System**: Push notifications for critical alerts, daily summaries, and communication updates.

## 2. User Stories

*   **As an NRI family member**, I want to trigger an emergency alert for my parent in India so that I can ensure their immediate safety, even from a distance.
*   **As an NRI family member**, I want to view my parent's real-time health status and daily activity log so that I can stay informed and reduce my anxiety.
*   **As a local family member**, I want to communicate easily with the assigned caregiver and other family members to coordinate care and share responsibilities.
*   **As a senior**, I want a simple, intuitive interface to trigger an emergency alert and receive medication reminders.
*   **As a caregiver**, I want to log daily activities and health observations efficiently and communicate with the family through the app.

## 3. Proposed Tech Stack

*   **Mobile Development Framework**: React Native (for cross-platform iOS and Android compatibility).
*   **Backend Integration**: Node.js/Express APIs (existing and new endpoints for mobile-specific functionalities).
*   **Real-time Communication**: Socket.IO or WebSockets for instant messaging and alerts.
*   **Database**: Supabase (PostgreSQL) for user data, communication logs, and health metrics storage.
*   **Authentication**: JWT-based authentication with secure token management.
*   **Push Notifications**: Firebase Cloud Messaging (FCM) for Android, Apple Push Notification service (APNs) for iOS.
*   **UI/UX Library**: React Native Paper or NativeBase for Material Design components.

## 4. Future Enhancements (Post-MVP)

*   **Video Calling**: In-app video calls between family members, seniors, and caregivers.
*   **Medication Management**: Advanced features for scheduling, tracking, and verifying medication intake.
*   **IoT Device Integration**: Seamless integration with smart home devices and wearables for enhanced monitoring.
*   **AI-Powered Insights**: Personalized health recommendations and predictive analytics directly in the app.
*   **Multi-language Support**: Expand beyond English to include regional Indian languages.
*   **Payment Gateway Integration**: For subscription management and additional services.
*   **Care Plan Customization**: Allow families to customize and manage care plans within the app.
*   **Offline Mode**: Basic functionalities available even without internet connectivity.