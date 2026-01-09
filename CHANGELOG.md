## [1.4.1.1] - 2026-01-10

### Changed
- Removed duplicates count/stat from the UI to prevent confusion.
- Duplicate detection badges remain; only the stats panel counter was removed.

# Changelog

All notable changes to the Vinted Geolocator userscript will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2026-01-09

### Added
- **Seller flagging system** - Click badge on any item to flag/unflag the seller
  - Persistent storage of flagged sellers across sessions
  - Automatic detection of items from previously flagged sellers
  - Visual 🚩/🏷️ badge toggle (top-left of items)
- **Pause/Resume control** - New toggle button in header (⏸/▶) to pause/resume processing
  - Pauses both scanning and API calls cleanly
  - Status updates reflect paused state
- **Instant cached loading** - Cached items now load immediately during scan
  - No more queue delay for previously processed items
  - Significant performance improvement on repeat visits

### Changed
- **Duplicate detection improvements**
  - Now groups by seller username when available (more accurate)
  - Changed badge icon from 🔄 to 👤 for clarity
  - Displays seller username on duplicate badges (e.g., "👤 john_d…")
  - Color-coded per seller: each seller gets a consistent gradient color
  - Repositioned badges to bottom-left of item image overlay
  - Full seller name shown in badge tooltip
- Cache format now includes seller username (backward compatible)
- Seller flag badge includes username in storage and display

### Technical
- New state: `isPaused`, `flaggedSellers` Set, `sellerBadgeColors` Map
- Seller color palette with 10 distinct gradients cycling per page
- Badge anchoring improved to use image overlay container for accurate positioning
- Duplicate badge styling: translucent gradient with subtle blur for visibility

## [1.4.0] - 2026-01-09

### Added
- **Include mode (whitelist filtering)** - Changed from exclude/blacklist mode to include/whitelist mode
  - Users now select which countries they want to **show** instead of which to hide
  - More intuitive filtering: "Include Countries" instead of "Exclude Countries"
  - If no countries selected, all items are shown; if countries selected, only those are shown

### Changed
- Filter logic inverted: display items only from selected countries (if any selected)
- Session storage key changed from `vinted_excluded_countries` to `vinted_included_countries`
- All checkbox IDs changed from `exclude-{country}` to `include-{country}`
- Status messages updated: "Showing only X" instead of "Excluding X"
- Preset system now saves/loads included countries instead of excluded
- Minimize button shows count of hidden items when selection is active

### Technical
- Filter logic: `match = includedCountries.length === 0 || includedCountries.includes(item.country)`
- Allows seamless migration: users can manually re-select preferred countries
- Maintains all other features: presets, duplicates, dark mode, caching

## [1.3.0] - 2026-01-04

### Added
- **Item location caching** - Items' location data is now cached in localStorage to avoid repeated API requests
- Cache never expires - once an item's location is known, it's stored permanently
- Clear Cache button now also clears localStorage cache
- Faster loading for previously seen items - no API calls needed

### Technical
- Cache keys use format `vinted_item_{itemId}` with JSON data containing country, city, and timestamp
- Cache is checked before making API requests in processQueue function
- Cached items process instantly with 100ms timeout instead of 1000ms

## [1.2.0] - 2026-01-04

### Added
- **Country exclusion filter** - Replaced single-country selection with multi-country exclusion checkboxes
- Check multiple countries to hide items from those locations
- More flexible filtering - exclude unwanted countries instead of showing only one
- Improved UI with scrollable country checkboxes grid
- Updated description and version info

### Changed
- Filter logic now excludes selected countries instead of including only one
- Status messages updated to reflect exclusion behavior
- Match counter now shows "Shown Items" instead of "Matching Filter"
- Session storage key changed from `vinted_filter_country` to `vinted_excluded_countries`

## [1.1.9] - 2026-01-04

### Added
- **Nordic countries support** - Added vinted.se with Swedish catalog path `/kläder`
- Country flags 🇸🇪 🇩🇰 🇫🇮 and filtering for Swedish, Danish, and Finnish sellers

## [1.1.8] - 2026-01-02

### Fixed
- **Captcha popup now auto-closes** when solved
- Fixed detection of array response format `[{"code":104,...}]`
- Popup closes automatically once captcha verification succeeds

---

## [1.1.7] - 2026-01-01

### Fixed
- **Filter toggle now fully stops processing** when disabled
- Scanning and queue processing halt immediately when filter is off
- Country overlays are removed when filter is disabled
- Queue and processed items are cleared when disabling

### Changed
- Cleaner browsing experience when filter is disabled (no tags or overlays)

---

## [1.1.6] - 2026-01-01

### Added
- **Filter toggle switch** - Enable/disable filtering with a single click
- Browse Vinted normally without the filter active
- Toggle state persists across page navigation (session storage)
- Visual feedback with smooth toggle animation
- Filter options are grayed out when disabled

### Changed
- Improved UI with prominent toggle switch at the top of the panel

---

## [1.1.5] - 2026-01-01

### Fixed
- **Auto-captcha detection** now properly detects when captcha is solved
- Added `credentials: 'include'` to ensure cookies are sent with captcha check requests
- Improved response parsing with fallback for non-JSON responses
- Changed detection logic to trigger on any non-403 status code

### Changed
- Reduced captcha check interval from 2 seconds to 1.5 seconds for faster detection
- Added console logging for easier debugging (`[Vinted Filter] Captcha solved!`)

---

## [1.1.4] - 2026-01-01

### Added
- **Auto-captcha solver** - Automatically opens a popup window when captcha is triggered
- Popup monitors API responses and auto-closes when captcha is solved
- Script automatically resumes processing after captcha completion
- "Reopen Captcha Popup" button if popup is accidentally closed
- "Resume Manually" button as fallback option

### Changed
- Updated captcha warning UI text to reflect auto-solve functionality
- Improved user experience with automatic captcha handling

---

## [1.1.3] - 2026-01-01

### Added
- **Page filtering** - Script now only runs on appropriate pages
- Supports homepage (`/`) and catalog pages across all Vinted sites

### Changed
- Script exits early on inbox, profile, settings, and item detail pages
- Reduces unnecessary processing and potential conflicts

### Supported Catalog Paths
- `/catalog` - Standard catalog
- `/vetements` - French catalog
- `/kleding` - Dutch catalog  
- `/ropa` - Spanish catalog
- `/abbigliamento` - Italian catalog
- `/kleidung` - German catalog

---

## [1.1.2] - 2025-12-31

### Added
- **Enhanced GUI** with modern, polished design
- Draggable floating panel
- Minimize/expand functionality
- Progress bar showing scan progress
- Live statistics (matching items, total items, queue size)
- Feedback and Report Issue buttons
- Clear Cache button
- Version info in UI footer

### Changed
- Improved overlay styling with gradient backgrounds
- Better visual feedback during processing
- Enhanced select dropdown with hover/focus states

---

## [1.1.1] - 2025-12-31

### Added
- **Language detection** - Warns users if Vinted is not set to English
- Automatic language check every 2 seconds
- Visual warning panel when non-English detected

### Fixed
- Country detection now works reliably with English locale

---

## [1.1.0] - 2025-12-31

### Added
- **Captcha handling** - Detects 403 (captcha) and 429 (rate limit) responses
- Visual warning when API is blocked
- Manual captcha solving workflow
- Rate limiting protection with automatic retry

### Changed
- Improved error handling in API requests
- Better queue management when blocked

---

## [1.0.0] - 2025-12-31

### Added
- **Initial release**
- Country and city detection via Vinted API
- Visual filtering by country (opacity + grayscale for non-matching items)
- Country flag badges on item cards
- Support for 9 countries: Netherlands, Belgium, France, Germany, Spain, Italy, Portugal, Poland, UK
- Floating filter menu with country dropdown
- Session storage for filter persistence
- Support for 6 Vinted sites: .nl, .be, .fr, .de, .es, .it

### Technical
- Pure JavaScript, no external dependencies
- Uses Vinted's public `/api/v2/items/{id}/details` endpoint
- Client-side only - no server modifications
- No tracking, analytics, or third-party data sharing
