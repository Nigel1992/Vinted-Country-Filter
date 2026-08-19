# 🎉 New Features Added (v1.3.0+)

## New in v1.4.8

- **Reliable login detection** — The script now detects the stable `header-avatar` portion of Vinted's CSS-module avatar class, preventing false login warnings when its generated class hash changes.

## New in v1.4.2

- **Tabbed Main/Settings layout** — cleaner separation of controls with active tab remembered across sessions.
- **Subtle tab switch animation** — fade/slide effect when changing tabs for smoother navigation.
- **Captcha flow polish** — popup auto-opens on 403 and closes as soon as a 200 response is detected, with a single alert to prevent spam.

## GUI Enhancements

### 1. 🌙 Dark Mode Toggle
- **Location**: Top-right of the menu header
- **Function**: Click the sun/moon icon to switch between light and dark themes
- **Storage**: Preference saved in session storage and persists across page reloads

### 2. 🔽 Collapsible Country List
- **Location**: Next to "Exclude Countries" label
- **Function**: Click `▼` (collapse) or `▶` (expand) to toggle country checkboxes visibility
- **Benefit**: Saves screen space when you don't need to change filters
- **Storage**: Collapse state remembered in session storage

### 3. 📊 Stats Badge on Minimize Button
- **Location**: Top-right minimize button (−)
- **Display**: Shows count of blocked items, e.g., `− (5)` means 5 items are hidden
- **Updates**: Automatically updates as you filter items
- **Helps**: Quick glance at how many items match your exclusion rules

### 4. ⌨️ Keyboard Shortcut (Alt+V)
- **Function**: Press `Alt+V` to quickly minimize/expand the menu
- **Tooltip**: Hover over minimize button to see the hint `(Alt+V)`
- **Use case**: Fast toggle for when you want full-screen browsing

### 5. 💾 Preset Management Section
- **Location**: New collapsible panel under "Filter Active" toggle
- **Features**:
  - **Save Preset**: Click "💾 Save" → enter name → current filter is saved
  - **Load Preset**: Select from dropdown and click "Load"
  - **Delete Preset**: Select preset and click "Delete"
  - **Export**: Download all presets as JSON file for backup/sharing
  - **Import**: Upload JSON file to restore presets

---

## Functional Enhancements

### 6. 📥📤 Export/Import Presets
- **Export**: All presets downloaded as `vinted-presets.json`
- **Import**: Upload JSON to merge presets (non-destructive)
- **Use case**: 
  - Backup your filter configurations
  - Share presets with friends
  - Quick switching between different filter strategies

### 7. 📊 Reset Stats Button
- **Location**: New button in bottom panel (purple)
- **Function**: Click "📊 Reset Stats" to clear duplicate detection counters
- **Does NOT**: Clear cache or filter settings
- **Useful for**: Refreshing the page metrics after applying new filters

### 8. 🔄 Duplicate Detector
- **What it does**: Detects items from the same seller/location with similar characteristics
- **Visual indicator**: Pink `🔄` badge appears on duplicate items
- **Counter**: New "🔄 Duplicates" stat shows total duplicate count
- **Algorithm**: Groups items by seller country + location description
- **Benefit**: Easily spot if the same seller has multiple identical listings

---

## Counter Updates

Added new counter display:
- **✅ Shown Items**: Items not excluded by your filters
- **📦 Total on Page**: All items scanned so far
- **🔄 Duplicates**: Total number of duplicate items detected (NEW)
- **⏳ In Queue**: Items waiting to be processed

---

## Storage & Persistence

### Dark Mode
- Stored in: `sessionStorage.vinted_dark_mode`
- Persists across page refreshes within same session

### Collapsed State
- Stored in: `sessionStorage.vinted_country_collapsed`
- Persists across page refreshes within same session

### Presets
- Stored in: `localStorage.vinted_presets` (JSON object)
- Persists forever until manually deleted
- Export/Import uses JSON format

---

## Tips & Tricks

1. **Quick Filters**: Save your most-used country combinations as presets (e.g., "Exclude Near", "EU Only")
2. **Night Browsing**: Enable dark mode in the evening to reduce eye strain
3. **Performance**: Collapse country list when browsing to reduce visual clutter
4. **Backup**: Regularly export presets in case you clear browser data
5. **Duplicates**: Use the duplicate badge to identify bulk sellers or resellers

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+V` | Toggle menu minimize/expand |

---

## Version History

- **v1.4.2**: Tabbed Main/Settings UI, tab animations, captcha auto-open/close polish
- **v1.3.0+**: Added all above features
- **v1.3.0**: Original release with basic filtering
