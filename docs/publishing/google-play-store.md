# Publishing Your Expo App to the Google Play Store (First Time Guide)

This guide provides a detailed step-by-step process for publishing your Expo application to the Google Play Store for the first time. It assumes you have a finished Expo app ready for release.

**Main Tools You'll Use:**

- Your Code Editor (e.g., VS Code)
- Expo Application Services (EAS) Command Line Interface (CLI)
- The Google Play Console website

---

## Phase 1: Prerequisites

Before you start, ensure you have the following:

### 1. Google Developer Account

You need a Google Developer account to publish apps on Google Play.

- **Action:** Go to the [Google Play Console Signup Page](https://play.google.com/console/signup).
- **Action:** Sign in with the Google Account you want associated with your developer profile.
- **Action:** Follow the on-screen instructions to review and accept the Google Play Developer Distribution Agreement.
- **Action:** Pay the one-time $25 USD registration fee using a valid payment method.
- **Action:** Complete your account details. Account verification might take up to 48 hours.

### 2. Understand Google Play Policies

It's crucial to understand Google's rules to avoid rejection or removal of your app.

- **Why:** Google has strict policies regarding content, privacy, security, monetization, and more. Violations can lead to app suspension.
- **Action:** Familiarize yourself with the [Google Play Developer Program Policies](https://play.google.com/developer-content-policy/). Pay close attention to sections on:
  - Restricted Content (e.g., hate speech, violence, gambling)
  - Intellectual Property
  - Privacy, Security, and Deception
  - Monetization and Ads
  - Store Listing and Promotion
- **Note:** Ignorance of the policies is not an excuse for violations.

### 3. Target API Level Requirements

Google requires new apps and updates to target recent Android API levels for security and performance reasons.

- **Why:** Ensures apps leverage the latest platform features and protections.
- **How Expo Handles It:** Expo typically manages the `targetSdkVersion` based on the Expo SDK version you are using. You usually don't need to set this manually.
- **Verification (Optional):** You can see the target SDK version Expo uses for your SDK version in the Expo documentation or potentially inferred in `app.config.js` under `android.targetSdkVersion` if you were overriding it (not common).
- **Reference:** Keep an eye on the official [Android Target API Level Requirements](https://developer.android.com/google/play/requirements/target-sdk) for future updates.

---

## Phase 2: Preparing Your Expo App

Configure your app correctly within your Expo project.

### 1. Action: Open and Verify `app.config.js`

This file contains critical metadata for your native app builds.

- **Action:** Open `app.config.js` (or `app.json`) in your code editor.
- **Verify `expo.name`:** This is the user-visible name on the device's home screen.
  ```javascript
  // app.config.js
  export default {
    expo: {
      name: 'Your App Name',
      // ... other config
    },
  };
  ```
- **Verify `expo.android.package`:** This is your app's unique identifier on the Play Store and the device.
  - **CRITICAL:** Choose this carefully (e.g., `com.yourcompanyname.yourappname`). **It cannot be changed after your app is first published.** Use reverse domain name notation.
  ```javascript
  // app.config.js
  export default {
    expo: {
      // ...
      android: {
        package: 'com.yourcompany.yourappname',
        // ... other android config
      },
    },
  };
  ```
- **Set Initial Versioning:**
  - `expo.version`: The user-visible version string (e.g., "1.0.0"). Follow semantic versioning (Major.Minor.Patch).
  - `expo.android.versionCode`: An internal, positive integer version number. **Must be unique and higher for every build uploaded to Google Play (including test tracks).** Start with `1` for your very first build.
  ```javascript
  // app.config.js
  export default {
    expo: {
      version: '1.0.0',
      // ...
      android: {
        package: 'com.yourcompany.yourappname',
        versionCode: 1,
        // ...
      },
    },
  };
  ```
- **Verify Icons:**
  - Check the `expo.icon` path (e.g., `./assets/images/icon.png`).
  - **Action: Check File System:** Ensure the icon file exists at this path. A 1024x1024px PNG is recommended. EAS Build uses this to generate adaptive icons required by modern Android versions.
  ```javascript
  // app.config.js
  export default {
    expo: {
      icon: './assets/images/icon.png',
      // ...
    },
  };
  ```
- **Verify Splash Screen:**
  - Check the `expo.splash` configuration, especially the `image` path (e.g., `./assets/images/splash-icon.png`).
  - **Action: Check File System:** Ensure the splash screen image exists at the specified path.
  ```javascript
  // app.config.js
  export default {
    expo: {
      splash: {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff', // Example background color
      },
      // ...
    },
  };
  ```
- **Review Permissions:**
  - Check the `expo.android.permissions` array.
  - **Action:** Remove any permissions your app doesn't actually need. Requesting unnecessary permissions can deter users and cause issues during review.
  - If requesting sensitive permissions (like `ACCESS_FINE_LOCATION`, `CAMERA`), be prepared to justify their use in the Google Play Console Data Safety section.
  - Reference: [Expo Permissions Guide](https://docs.expo.dev/guides/permissions/)
  ```javascript
  // app.config.js
  export default {
    expo: {
      // ...
      android: {
        // Example: Only include permissions your app truly requires
        permissions: ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
        // ...
      },
    },
  };
  ```
- **Verify Updates Configuration (if using `expo-updates`):**
  - Ensure `expo.updates.url` is correctly set to your published update endpoint if you are using EAS Update.
  ```javascript
  // app.config.js
  export default {
    expo: {
      updates: {
        url: 'https://u.expo.dev/YOUR_PROJECT_ID', // Example EAS Update URL
      },
      // ...
    },
  };
  ```

### 2. Responsive Design Testing

Ensure your app looks and works correctly on various screen sizes.

- **Why:** Google Play requires apps to be usable on different devices, including tablets, even if not specifically targeted. Apple may also reject apps that render poorly on iPads.
- **Action:** Test your app thoroughly:
  - Use Android Studio emulators or simulators for different screen sizes (e.g., a small phone like Pixel 3a, a large phone like Pixel 7 Pro, a tablet like Pixel C). Run using `npx expo start --android`.
  - Test on physical Android devices if available.
  - Check for:
    - Layout issues (overlapping elements, elements off-screen)
    - Text being cut off
    - Buttons or interactive elements being inaccessible
    - Crashes or unexpected behavior

---

## Phase 3: Verify Configuration and Build with EAS

Generate the Android App Bundle (`.aab`) file needed for Google Play.

### 1. Action: Final Configuration Review

Before building, double-check your configuration files.

- **Action:** Re-open `app.config.js`. Confirm `expo.android.package`, `expo.version`, and `expo.android.versionCode` are correct. Ensure `versionCode` is `1` for the very first build.
- **Action:** Open `eas.json`.
  - Verify you have a `production` profile under `build`.
  - Ensure the `android` section within the `production` profile includes `"buildType": "app-bundle"`. This tells EAS to generate the required `.aab` format for Google Play.
  - A minimal `production` profile might look like this:
  ```json
  // eas.json
  {
    "cli": {
      "version": ">= 7.6.2" // Example: Use a recent EAS CLI version
    },
    "build": {
      "development": {
        // ... development client config
      },
      "preview": {
        // ... preview config
      },
      "production": {
        "android": {
          "buildType": "app-bundle"
          // "credentialsSource": "local" // Uncomment if managing keystore manually (not recommended for first time)
        }
        // Add iOS config here if needed
      }
    },
    "submit": {
      "production": {} // Configuration for EAS Submit (optional for now)
    }
  }
  ```
  - **App Signing:** By default, EAS Build will generate and manage the necessary app signing keys for you (`credentialsSource: 'remote'`). This is the recommended approach, especially for beginners. Google Play also uses its own signing key ("App Signing by Google Play"), which EAS integrates with seamlessly.

### 2. Install/Update EAS CLI

Ensure you have a recent version of the EAS command-line tool.

- **Action:** Open your terminal or command prompt.
- **Action:** Run `npm install -g eas-cli`.

### 3. Login to Expo Account

Authenticate the EAS CLI with your Expo account.

- **Action:** Run `eas login` in your terminal.
- **Action:** Enter your Expo username and password when prompted.

### 4. Start the Build

Initiate the production build process on EAS servers.

- **Action:** Navigate to your project directory in the terminal.
- **Action:** Run the command: `eas build -p android --profile production`
- **What Happens:** EAS CLI uploads your project, queues the build, and provides a link to monitor progress. This can take some time (15-30 minutes or more).

### 5. Monitor Build Progress

- **Action:** Click the build details link provided in the terminal output, or go to your [Expo dashboard](https://expo.dev/dashboard) and find the build under your project.

### 6. Download the Build Artifact

Once the build status is "Finished", download the app bundle.

- **Action:** On the build details page on the Expo website, find the "Build artifacts" section.
- **Action:** Click the "Download" button to get the `.aab` file. Save this file; you'll upload it to Google Play.

---

## Phase 4: Google Play Console - App Setup & Listing

Now, set up your app's presence on the Google Play Store.

### 1. Navigate to Google Play Console

- **Action:** Go to the [Google Play Console](https://play.google.com/console/) and sign in.

### 2. Create Your App

- **Action:** In the left menu, click "All apps".
- **Action:** Click the "Create app" button (usually top right).
- **Action:** Fill in the initial details:
  - **App name:** The name displayed on Google Play (can be different from `expo.name`).
  - **Default language:** Your app's primary language.
  - **App or game:** Select "App".
  - **Free or paid:** Choose carefully. **You cannot change a Free app to Paid later.** You _can_ change Paid to Free.
- **Action:** Read and accept the Declarations (Developer Program Policies and US export laws).
- **Action:** Click "Create app". You'll be taken to the app's dashboard.

### 3. Initial Setup Dashboard

The dashboard guides you through the essential setup tasks. Work through these first. Many overlap with the sections below.

### 4. Store Presence -> Main Store Listing

This is your app's page on Google Play. Make it appealing and informative.

- **Action:** Navigate to "Grow" > "Store presence" > "Main store listing" in the left menu.
- **App details:**
  - **Action:** Write a concise **Short description** (max 80 characters). This appears prominently.
  - **Action:** Write a detailed **Full description** (max 4000 characters). Explain what your app does, its key features, and benefits. Use relevant keywords users might search for.
- **Graphics:** Visuals are crucial for attracting users.
  - **Action: App icon:** Upload your 512x512px app icon (32-bit PNG with alpha). This _must_ visually match the icon embedded in your app build.
  - **Action: Feature graphic:** Upload a 1024x500px JPG or 24-bit PNG (no alpha). This is often shown at the top of your listing.
  - **Action: Phone screenshots:** Upload at least 2 (max 8) screenshots.
    - Format: JPG or 24-bit PNG (no alpha).
    - Size: Between 320px and 3840px. Aspect ratio max 2:1 or 1:2.
    - Content: Showcase the main screens and functionality of your app. Use portrait or landscape as appropriate for your app.
  - **Optional:** Add Tablet screenshots (7-inch and 10-inch), TV banner, Promo video (YouTube URL). Providing tablet screenshots is highly recommended if your app works well on tablets.
- **Action:** Click "Save".

### 5. App Content Section (CRITICAL)

You _must_ complete all applicable sections here before you can publish. Google uses this information for review, ratings, and data safety disclosures.

- **Action:** Navigate to "Policy" > "App content" in the left menu. Address each section:
  - **Privacy Policy:**
    - **Action:** Click "Start".
    - **Action:** Enter the URL for your app's privacy policy. (You need to host this yourself, e.g., on a simple website, GitHub Pages, or using a privacy policy generator service). This URL must be publicly accessible.
    - **Action:** Click "Save".
  - **Ads:**
    - **Action:** Click "Start".
    - **Action:** Declare whether your app contains advertisements (including third-party ad networks).
    - **Action:** Click "Save".
  - **App access:**
    - **Action:** Click "Start".
    - **Action:** If your app requires login or has restricted areas, select "All or some functionality is restricted". Provide clear instructions and any necessary demo account credentials (username/password) so Google reviewers can fully test your app. If no login is needed, select "All functionality is available without special access".
    - **Action:** Click "Save".
  - **Content ratings:**
    - **Action:** Click "Start".
    - **Action:** Click "Start questionnaire".
    - **Action:** Enter your email address.
    - **Action:** Select your app category.
    - **Action:** Answer the questions about your app's content (violence, sexuality, language, controlled substances, etc.) accurately and honestly. Your answers determine the age ratings (IARC) assigned to your app globally.
    - **Action:** Click "Save", then "Next", then "Submit".
  - **Target audience and content:**
    - **Action:** Click "Start".
    - **Action:** Select the target age group(s) for your app. Be accurate. If you select ages under 18, additional policy requirements may apply.
    - **Action:** Answer the questions about whether your store listing could unintentionally appeal to children.
    - **Action:** Click "Save".
  - **News apps:**
    - **Action:** Click "Start".
    - **Action:** Declare if your app is a news app according to Google's definition.
    - **Action:** Click "Save".
  - **COVID-19 contact tracing and status apps:**
    - **Action:** Click "Start".
    - **Action:** Declare if your app fits this category (unlikely for most apps now).
    - **Action:** Click "Save".
  - **Data safety:**
    - **Action:** Click "Start". This section is **very important** and requires careful attention.
    - **Action:** Follow the questionnaire. You must declare:
      - Whether your app collects or shares any user data types listed.
      - The types of data collected/shared (e.g., Location, Personal info, Financial info, App activity, Device IDs).
      - How each data type is used (e.g., App functionality, Analytics, Developer communications, Advertising, Fraud prevention, Personalization).
      - Whether data collection is optional for the user.
      - Whether data is encrypted in transit.
      - Whether you provide a way for users to request data deletion.
    - **Be Thorough:** Consider data collected not just by your code, but also by any third-party SDKs you use (including Expo modules like `expo-location`, `expo-analytics`, authentication services, ad networks, `expo-updates` for crash reporting).
    - **Reference:** [Google's Data Safety Guidance](https://support.google.com/googleplay/android-developer/answer/10787469).
    - **Action:** Complete the questionnaire accurately and click "Save". This information will be displayed on your store listing. Inaccuracies can lead to policy violations.
  - **Government apps:**
    - **Action:** Click "Start". Declare if your app is developed on behalf of a government entity.
    - **Action:** Click "Save".
  - **Financial features:**
    - **Action:** Click "Start". Declare if your app provides any regulated financial features (e.g., loans, cryptocurrency trading).
    - **Action:** Click "Save".

### 6. Pricing & Distribution

Configure where and how your app is available.

- **App Pricing:**
  - **Action:** Navigate to "Monetize" > "App pricing" in the left menu.
  - **Action:** Confirm your choice of "Free" or "Paid". If Paid, set the price. Remember, Free apps cannot become Paid later.
- **Countries / regions:**
  - **Action:** Navigate to "Release" > "Production".
  - **Action:** Go to the "Countries / regions" tab.
  - **Action:** Click "Add countries / regions".
  - **Action:** Select the specific countries or regions where you want your app to be available. You can select all or choose individually.
  - **Action:** Click "Add countries / regions", then confirm by clicking "Add".

---

## Phase 5: Testing Your App

Before releasing to the public, test your app using Google Play's testing tracks.

### 1. Why Test?

- Catch bugs and crashes specific to certain devices or Android versions.
- Get feedback on usability and features from a trusted group.
- Ensure server integrations work correctly.
- Verify the installation process.

### 2. Testing Tracks Overview

Google Play offers several tracks (found under "Release" > "Testing" in the left menu):

- **Internal testing:** For a small group of trusted testers (up to 100). Builds are available almost immediately. Good for quick checks and QA.
- **Closed testing:** For a larger, specific group identified by email lists or Google Groups. Requires review by Google (usually faster than production review). Good for beta programs with invited users.
- **Open testing:** Anyone with the opt-in link can join. Also requires Google review. Good for public beta testing before full launch.

### 3. Setting Up Internal Testing (Recommended First Step)

- **Action:** Navigate to "Release" > "Testing" > "Internal testing".
- **Action:** Go to the "Testers" tab.
  - **Action:** Click "Create email list". Give the list a name (e.g., "Internal QA Team").
  - **Action:** Add the email addresses of your testers (Google accounts required), separated by commas or uploaded as a CSV.
  - **Action:** Click "Save changes". Make sure the checkbox next to your list is checked to make it active.
  - **Action:** Copy the "Opt-in link" provided. Share this link with your testers. They need to accept the invitation via this link to receive test builds.
- **Action:** Go back to the "Releases" tab.
- **Action:** Click "Create new release".
- **App Signing by Google Play:** You'll likely be prompted to accept App Signing by Google Play. This is highly recommended. Google securely manages your app signing key, which is required for using the App Bundle format. Review the terms and click "Accept".
- **App bundles:**
  - **Action:** Click "Upload" and select the `.aab` file you downloaded from EAS Build. Wait for it to process.
- **Release details:**
  - **Action:** Enter a Release name (internal, e.g., "Internal Test 1.0.0").
  - **Action:** Enter Release notes (what's new or what to test in this build).
- **Action:** Click "Save" (saves as draft).
- **Action:** Click "Review release". Check for any errors or warnings.
- **Action:** Click "Start rollout to internal testing".

Testers can now download the app via the Play Store app on their devices (it might take a short while to appear after opting in).

### 4. Using Closed/Open Testing

The process is similar to Internal Testing: create tester lists (for Closed) or use the opt-in link (for Open), create a release, upload the AAB, and roll it out. Remember these tracks require Google review before the build is available to testers.

---

## Phase 6: Submitting to Production

Once you're confident after testing, release your app to the public.

### 1. Promote from Testing (Optional but Recommended)

If a build performed well in a testing track (e.g., Open Beta), you can promote that exact build to production.

- **Action:** Go to the testing track (e.g., "Open testing").
- **Action:** Find the release you want to promote.
- **Action:** Click "Promote release" > "Production".

### 2. Create a New Production Release (If not promoting)

- **Action:** Navigate to "Release" > "Production" in the left menu.
- **Action:** Click "Create new release".
- **Action:** Upload the final, production-ready `.aab` file.
  - **CRITICAL:** Ensure its `versionCode` in `app.config.js` is higher than _any_ previously uploaded build (production or testing).
- **Action:** The release name will likely auto-populate based on the version in the AAB.
- **Action:** Enter **Release notes** for users. Explain what's new or changed in this version. This is visible on the Play Store listing.
- **Action:** Click "Save".
- **Action:** Click "Review release".
  - The console will perform checks and highlight any **Errors** (must be fixed before rollout), **Warnings** (should be reviewed but may not block rollout), or **Messages**.
  - **Common Errors:** Missing information in the "App Content" section, policy violations detected, invalid AAB file.
  - **Action:** Fix any errors reported. You might need to go back to other sections of the console (like App Content) or even rebuild your app if the error is in the AAB itself.
- **Action:** Once all errors are resolved and you're ready, click "Start rollout to Production".
  - You can choose a **Staged Rollout** (release to a percentage of users first) or **Full Rollout** (release to 100% of users in selected countries). For a first launch, Full Rollout is common.

### 3. The Review Process

- **What Happens:** Google's team (and automated systems) will review your app submission against their policies.
- **Timeframe:** This can take anywhere from a few hours to several days (sometimes longer, especially for new developer accounts or complex apps).
- **Notifications:** You'll receive email updates on the review status. You can also check the status in the Play Console on your app's dashboard or Production track page.
- **Approval:** If approved, your app will become available ("Published") on the Google Play Store in the countries you selected. It can take a few hours after approval for it to appear in search results.
- **Rejection:** If rejected, Google will provide reasons via email and in the console. Carefully read the feedback, make the necessary changes (either in the console settings or in your app code requiring a rebuild/resubmit), and submit the app for review again.

---

## Phase 7: Post-Launch

Publishing is just the beginning! Maintain and improve your app.

### 1. Monitor Performance

Regularly check the Google Play Console for insights:

- **Statistics (under "Statistics" menu):** Track downloads, installs, uninstalls, install/uninstall rates by country, device, etc.
- **Ratings & Reviews (under "Quality"):** Read user feedback. Respond professionally to reviews (positive and negative). Identify common issues or feature requests.
- **Vitals (under "Quality"):** Monitor **Crashes** and **ANRs** (Application Not Responding). High rates negatively impact your app's visibility. Use the reports to diagnose and fix stability issues. Firebase Crashlytics (if integrated) can provide more detailed crash reports.

### 2. Plan Updates

Keep your app fresh and fix issues.

- **Action:** When releasing an update:
  - Increment `expo.version` (e.g., "1.0.1" or "1.1.0").
  - **CRITICAL:** Increment `expo.android.versionCode` (e.g., from `1` to `2`).
  - Build a new `.aab` using `eas build -p android --profile production`.
  - Create a new release in the Production track (or test first in a testing track).
  - Upload the new AAB and write release notes.
  - Roll out the update.

### 3. User Support

Provide ways for users to get help.

- Include contact information (email or website) in your store listing.
- Respond to reviews seeking support.
- Consider adding an in-app help or feedback section.

---

## Resources

- [Google Play Console Help Center](https://support.google.com/googleplay/android-developer)
- [Expo Documentation: Distribution Overview](https://docs.expo.dev/distribution/introduction/)
- [Expo Documentation: EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Documentation: App Config (`app.config.js`)](https://docs.expo.dev/versions/latest/config/app/)
- [Google Play Developer Program Policies](https://play.google.com/developer-content-policy/)
- [Google Play: Data safety Guidance](https://support.google.com/googleplay/android-developer/answer/10787469)

Good luck with your app launch!
