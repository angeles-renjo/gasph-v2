/Users/renjoangeles/Documents/GitHub/gasph-v2/
├─] .DS_Store (ignored)
├─] .cursor/ (ignored)
├─] .env (ignored)
├─] .env.local (ignored)
├─] .expo/ (ignored)
├── .gitignore
├── .vscode/
├── SYSTEM_NOTES.md
├─] android/ (ignored)
├── app/
│ ├── (tabs)/
│ │ ├── \_layout.tsx
│ │ ├── admin.tsx
│ │ ├── explore.tsx
│ │ ├── home.tsx
│ │ ├── index.tsx
│ │ ├── map.tsx
│ │ └── settings.tsx
│ ├── +html.tsx
│ ├── +not-found.tsx
│ ├── \_layout.tsx
│ ├── admin/
│ │ ├── \_layout.tsx
│ │ ├── cycles.tsx
│ │ ├── import-stations.tsx
│ │ ├── index.tsx
│ │ ├── reports.tsx
│ │ ├── stations.tsx
│ │ └── users.tsx
│ ├── auth/
│ │ ├── sign-in.tsx
│ │ └── sign-up.tsx
│ ├── contributions.tsx
│ ├── faq/
│ │ └── index.tsx
│ ├── favorites.tsx
│ ├── location-test.tsx
│ └── station/
│ ├── [id].tsx
│ └── community-prices.tsx
├── app.config.js
├── assets/
│ ├── fonts/
│ │ └── SpaceMono-Regular.ttf
│ ├── icons/
│ │ ├── adaptive-icon.png
│ │ ├── ios-dark.png
│ │ ├── ios-light.png
│ │ ├── ios-tinted.png
│ │ ├── splash-icon-dark.png
│ │ └── splash-icon-light.png
│ └── images/
├── components/
│ ├── LocationAwareScreen.tsx
│ ├── Themed.tsx
│ ├── **tests**/
│ ├── admin/
│ │ ├── ConfirmAddStationModal.tsx
│ │ ├── ConfirmUpdateStationModal.tsx
│ │ ├── CreateCycleModal.tsx
│ │ ├── CycleInfoBadge.tsx
│ │ ├── DashboardCard.tsx
│ │ ├── GooglePlacesImportScreen.tsx
│ │ ├── PriceCycleCard.tsx
│ │ ├── PriceCycleManagement.tsx
│ │ ├── StationListItem.tsx
│ │ └── UserListItem.tsx
│ ├── common/
│ │ ├── EmptyState.tsx
│ │ ├── ErrorDisplay.tsx
│ │ └── LoadingIndicator.tsx
│ ├── contributions/
│ │ └── ContributionsCard.tsx
│ ├── faq/
│ │ ├── FAQAccordionItem.tsx
│ │ └── FAQScreen.tsx
│ ├── home/
│ │ └── FuelPreferenceModal.tsx
│ ├── map/
│ │ ├── LocationPickerModal.tsx
│ │ ├── MapPriceCalloutCard.tsx
│ │ ├── StationInfoModal.tsx
│ │ └── StationMapView.tsx
│ ├── price/
│ │ ├── BestPriceCard.tsx
│ │ ├── DOEPriceDisplay.tsx
│ │ ├── DOEPriceTable.tsx
│ │ ├── PriceCard.tsx
│ │ ├── PriceConfirmation.tsx
│ │ └── PriceReportModal.tsx
│ ├── station/
│ │ ├── AddStationModal.tsx
│ │ ├── FavoriteButton.tsx
│ │ ├── ReportStationModal.tsx
│ │ └── StationCard.tsx
│ ├── ui/
│ │ ├── Button.tsx
│ │ ├── Card.tsx
│ │ ├── FilterControlBubble.tsx
│ │ ├── FloatingActionButton.tsx
│ │ └── Input.tsx
│ ├── useColorScheme.ts
│ └── useColorScheme.web.ts
├── constants/
│ ├── gasStations.ts
│ ├── map/
│ │ └── locationConstants.ts
│ └── supportedCities.ts
├── docs/
│ ├── architecture/
│ │ ├── overview.md
│ │ └── postgis_explanation.md
│ ├── database/
│ │ └── schema.md
│ ├── monetization/
│ │ └── payments.md
│ ├── publishing/
│ │ └── google-play-store.md
│ └── react-query-optimization.md
├── eas.json
├─] expo-env.d.ts (ignored)
├── filestructure.md
├── hooks/
│ ├── queries/
│ │ ├── admin/
│ │ │ ├── reports/
│ │ │ │ ├── useCreateStationMutation.ts
│ │ │ │ ├── useDeleteStationMutation.ts
│ │ │ │ ├── usePendingReports.ts
│ │ │ │ ├── useUpdateReportStatusMutation.ts
│ │ │ │ └── useUpdateStationMutation.ts
│ │ │ ├── useAdminProfile.ts
│ │ │ ├── useAdminStats.ts
│ │ │ ├── useImportStationsMutation.ts
│ │ │ ├── useStations.ts
│ │ │ ├── useSystemStats.ts
│ │ │ └── useUsers.ts
│ │ ├── prices/
│ │ │ ├── bestPricesUtils.ts
│ │ │ ├── useBestPrices.ts
│ │ │ ├── useBestPricesOptimized.ts
│ │ │ ├── usePriceConfirmation.ts
│ │ │ ├── usePriceConfirmationOptimized.ts
│ │ │ └── usePriceCycles.ts
│ │ ├── stations/
│ │ │ ├── useAllStations.ts
│ │ │ ├── useFavoriteStationPrices.ts
│ │ │ ├── useFavoriteStations.ts
│ │ │ ├── useFocusAwareStationHooks.ts
│ │ │ ├── useImportStations.ts
│ │ │ ├── useInfiniteStationsSortedByDistance.ts
│ │ │ ├── useNearbyStations.ts
│ │ │ ├── useStationDetails.ts
│ │ │ ├── useStationDoePrice.ts
│ │ │ ├── useStationFuelTypePrices.ts
│ │ │ └── useStationsWithPrices.ts
│ │ ├── users/
│ │ │ ├── useUserContributions.ts
│ │ │ └── useUserProfile.ts
│ │ └── utils/
│ │ ├── createFocusAwareHooks.ts
│ │ ├── queryKeys.ts
│ │ ├── queryOptions.ts
│ │ └── types.ts
│ ├── stores/
│ │ ├── useAuthStore.ts
│ │ ├── useLocationStore.ts
│ │ └── usePreferencesStore.ts
│ ├── useAppInitialization.ts
│ ├── useAuth.ts
│ ├── useAuthRedirect.ts
│ ├── useDebounce.ts
│ ├── useGoogleMapIosPerfFix.ios.ts
│ ├── useGoogleMapIosPerfFix.ts
│ ├── useLocation.ts
│ └── useSplashScreenManager.ts
├─] ios/ (ignored)
├── lib/
│ ├── geo.ts
│ ├── query-client.ts
│ └── react-query-native.ts
├── memory-bank/
│ ├── activeContext.md
│ ├── productContext.md
│ ├── progress.md
│ ├── projectbrief.md
│ ├── systemPatterns.md
│ └── techContext.md
├─] node_modules/ (ignored)
├── package-lock.json
├── package.json
├── styles/
│ ├── components/
│ │ ├── admin/
│ │ │ └── ConfirmAddStationModal.styles.ts
│ │ ├── map/
│ │ │ └── StationInfoModal.styles.ts
│ │ └── station/
│ │ └── AddStationModal.styles.ts
│ ├── mapStyle.json
│ ├── screens/
│ │ ├── ExploreScreen.styles.ts
│ │ ├── admin/
│ │ │ └── AdminReportsScreen.styles.ts
│ │ └── home/
│ │ └── HomeScreen.styles.ts
│ └── theme.ts
├── supabase/
│ ├── .temp/
│ │ └── cli-latest
│ ├── functions/
│ │ ├── \_shared/
│ │ └── delete-user-account/
│ ├── migrations/
│ └── sql/
│ └── functions/
│ ├── archive_old_price_cycles.sql
│ ├── assign_admin_role.sql
│ ├── audit_function_usage.sql
│ ├── check_duplicate_pending_report.sql
│ ├── check_favorite_limit.sql
│ ├── confirm_price_report.sql
│ ├── decrement.sql
│ ├── delete_user_by_id.sql
│ ├── get_favorite_station_prices.sql
│ ├── get_stations_sorted_by_distance.sql
│ ├── handle_delete_user.sql
│ ├── handle_new_user.sql
│ ├── increment.sql
│ ├── is_user_admin.sql
│ ├── manage_price_cycles.sql
│ ├── revoke_admin_role.sql
│ ├── update_confirmations_count.sql
│ ├── update_price_reference_timestamp.sql
│ └── validate_price_reports.sql
├── tsconfig.json
└── utils/
├── formatters.ts
├── locationUtils.ts
├── navigation.ts
├── placesApi.ts
└── supabase/
├── supabase.ts
└── types.ts
