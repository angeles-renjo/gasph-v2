# Monetization: Payments & Subscriptions

This document outlines the requirements and future implementation steps for handling payments and managing "Pro" user subscriptions in the GasPh application.

## Overview

The application uses a freemium model. Free users have limitations (e.g., 1 favorite station), while "Pro" users gain access to enhanced features (e.g., unlimited favorites). This requires a system to:

1.  Process payments for Pro subscriptions.
2.  Manage subscription status (active, expired, canceled).
3.  Update the user's `is_pro` status in the `profiles` table based on their subscription.

## Current State

- The `profiles` table has an `is_pro` boolean column (default `false`).
- Backend logic (Supabase function `check_favorite_limit` and a trigger) enforces the favorite limit based on the `is_pro` flag.
- Frontend components (`useFavoriteStations`, `FavoriteButton`) check the limit and display an upgrade prompt (`Alert`) if a free user tries to exceed it.

## Future Implementation Steps

### 1. Choose a Payment Provider/SDK

- **Recommendation:** [RevenueCat](https://www.revenuecat.com/) is highly recommended for mobile apps using Expo/React Native. It simplifies handling in-app purchases (IAP) across both iOS (App Store) and Android (Google Play) and manages subscription status syncing.
- **Alternatives:** Stripe (requires more backend setup), native IAP APIs (complex to manage directly).

### 2. Configure In-App Products

- Set up subscription products (e.g., "GasPh Pro Monthly", "GasPh Pro Yearly") in both the Apple App Store Connect and Google Play Console.
- Configure these products within the chosen payment provider's dashboard (e.g., RevenueCat).

### 3. Integrate Payment SDK

- Install the chosen SDK (e.g., `react-native-purchases` for RevenueCat).
- Initialize the SDK with API keys during app startup.
- Create UI components for:
  - Displaying subscription offerings ("Paywall" or "Upgrade Screen").
  - Initiating the purchase flow.
  - Restoring previous purchases.
  - Displaying current subscription status (e.g., in the user's profile screen).

### 4. Sync Subscription Status with Supabase

- **Webhook (Recommended with RevenueCat/Stripe):**
  - Configure the payment provider to send webhook events (e.g., `subscription_activated`, `subscription_expired`) to a secure Supabase Edge Function.
  - The Edge Function will receive the event, verify its authenticity, and update the corresponding user's `is_pro` flag in the `profiles` table. This is the most reliable way to keep the backend status in sync.
- **Client-Side Update (Less Reliable):**
  - After a successful purchase or status change detected by the SDK on the client, make a direct call (e.g., using a Supabase RPC function) to update the user's `is_pro` flag. This is less reliable as client-side updates can fail.

### 5. Update Frontend UI

- Replace the simple `Alert` in `FavoriteButton` with navigation to the dedicated "Upgrade Screen" when `FavoriteLimitError` is caught.
- Display "Pro" badges or indicators in relevant UI sections (e.g., profile screen) based on the `is_pro` status fetched via `useUserProfile`.
- Potentially hide/show certain features or UI elements based on `is_pro` status.

## Security Considerations

- Never trust the client to determine Pro status for critical features. Always rely on the backend (`is_pro` flag synced via webhook or secure RPC) for enforcement (like the favorite limit check).
- Securely handle API keys for the payment provider and Supabase.
- Validate webhook signatures to prevent spoofing.
