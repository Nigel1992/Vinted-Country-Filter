# Changelog

All notable changes to the Vinted Geolocator userscript will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
