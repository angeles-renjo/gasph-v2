# GasPH Project Cleanup Checklist

This checklist outlines the planned phases for cleaning up the GasPH project.

**State Management:**

- Client State: Zustand
- Server State: React Query v5

**Preferences:**

- Styling Consolidation: Create a new top-level `/styles` directory.
- Unused Code Removal: Ask for confirmation before removing potentially unused code.

---

**Phase 1: Preparation & Documentation Setup**

- [x] Create the main `docs/` directory at the project root. (Implicitly done by creating subdirs)
- [x] Create subdirectories within `docs/` (`docs/database/`, `docs/architecture/`). (Done by creating files within them)
- [x] Create and populate `docs/database/schema.md` with provided SQL definitions.
- [x] Create an initial `docs/architecture/overview.md` describing project structure and principles.
- [x] Complete initial analysis for unused code and styling consolidation candidates.

**Phase 2: Styling Consolidation**

- [x] Create the new top-level `/styles` directory.
- [x] Identify common styling patterns (colors, typography, spacing, common component styles).
- [x] Migrate these patterns to the `/styles` directory (`styles/theme.ts`).
- [x] Update components (`/components/ui`, `/components/common`, `/components/price`, `/components/station`, `/components/admin`) to import and use centralized styles.
- [ ] Remove local or duplicated style definitions where possible. (Note: Some styles remain local where highly specific or complex, e.g., shadows, specific layout logic)

**Phase 3: Unused Code Removal**

- [x] Perform a systematic search for unused code (components, hooks, utils, constants, assets). (Initial pass complete)
- [x] Review potential candidates and **ask for confirmation** before removing. (Done for initial candidates)
- [x] Remove confirmed unused code and assets. (Removed empty dirs, EditScreenInfo, ExternalLink, StyledText, useClientOnlyValue)
- [ ] Verify application functionality after removals. (To be done after Phase 4/5)

**Phase 4: Code Review & Refinement (Based on Principles)**

- [x] Review key components and hooks for adherence to KISS, SOLID, YAGNI, and correct state management usage (Zustand/React Query). (Reviewed PriceCard, BestPriceCard, CreateCycleModal, PriceCycleManagement, GooglePlacesImportScreen)
- [x] Refactor specific areas if clear violations or improvements are identified (discuss candidates first). (Extracted PriceConfirmation, DOEPriceDisplay)
- [x] Add code comments where logic is complex or non-obvious. (Added comments to PriceConfirmation, CreateCycleModal, PriceCycleManagement, GooglePlacesImportScreen)

**Phase 5: Final Documentation & Verification**

- [x] Update or expand documentation in `docs/` to reflect changes. (Updated architecture overview)
- [ ] Perform a final walkthrough of the application's main features for regression testing. (Requires manual testing by user - **Re-opened due to bug/warning fixes**)
- [x] Address any minor issues identified during verification. (Fixed `expires_at` bug, Fixed Text rendering warning in `UserListItem`, Commented out optimistic update in `usePriceConfirmation` due to RPC error)

**Phase 6: State Management Cleanup**

- [x] Review React Query query key consistency (`hooks/queries/utils/queryKeys.ts`). (Checked, looks good)
- [x] Review React Query `staleTime`/`gcTime` settings in key hooks. (Reviewed defaults, adjusted `stations.detail`)
- [x] Verify React Query mutation invalidations. (Checked `usePriceConfirmation`, `useImportStationsMutation`, refactored `PriceCycleManagement` mutations)
- [x] Analyze React Query functions for simplification/redundancy. (Reviewed `bestPricesUtils`, looks reasonable)
- [x] Ensure consistent React Query error handling. (Reviewed patterns, generally consistent use of Alert/ErrorDisplay)
- [x] Review Zustand store (`hooks/stores/useAuthStore.ts`) for clarity and necessity. (Checked, looks good)
- [x] Assess if other client state could benefit from Zustand. (Added `usePreferencesStore` for default fuel type)
- [x] Update architecture documentation (`docs/architecture/overview.md`) with state management patterns. (Updated to include `usePreferencesStore`)
- [x] Implemented UI for setting Default Fuel Type preference using `@react-native-picker/picker` in `app/(tabs)/profile.tsx`. (Requires rebuild)
- [x] Integrated Default Fuel Type preference into `useBestPrices` hook.
