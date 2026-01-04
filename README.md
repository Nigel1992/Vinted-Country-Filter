# 🌍 Vinted Geolocator

![Version](https://img.shields.io/badge/version-1.2.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow?style=for-the-badge&logo=javascript&logoColor=white)

> Reveal hidden seller locations on Vinted and filter items by country with a beautiful, intuitive UI.

"<img width="1179" height="601" alt="image" src="https://github.com/user-attachments/assets/981cf27b-1a9a-4f2f-b696-aebcf60a2456" />


## ✨ Features

- **🏳️ Country Flags** — Instantly see where each item ships from with flag badges
- **🔍 Smart Filtering** — Filter items by country with a single click
- **📊 Live Stats** — Track matching items, total scanned, and queue progress
- **🎨 Sleek UI** — Minimalist floating panel that stays out of your way
- **⚡ Lightweight** — Pure JavaScript, no external dependencies

## 🛒 Supported Vinted Sites

| Site | URL |
|------|-----|
| 🇳🇱 Netherlands | vinted.nl |
| 🇧🇪 Belgium | vinted.be |
| 🇫🇷 France | vinted.fr |
| 🇩🇪 Germany | vinted.de |
| 🇪🇸 Spain | vinted.es |
| 🇮🇹 Italy | vinted.it |
| 🇸🇪 Sweden | vinted.se |

## 📦 Installation

1. Install a userscript manager:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)

2. **[Click here to install the script](https://greasyfork.org/en/scripts/559753-vinted-country-city-filter-client-side)** from Greasy Fork

   *Or* create a new script and paste the contents of `code.js`

3. Visit any supported Vinted site and start browsing!

## 🎯 How It Works

1. The script scans visible items on the page
2. For each item, it fetches location data from Vinted's public API
3. Country flags are added to item cards
4. Use the floating panel to filter by your preferred country
5. Non-matching items fade out, keeping your focus on relevant listings

## ⚠️ Important Notes

- **Language**: Set Vinted to **English** for the script to work correctly
- **Rate Limits**: The script respects Vinted's API limits.
- **Visual Only**: Filtering is purely visual — it doesn't affect Vinted's search results

## 🔒 Privacy & Security

- ✅ No data sent to third parties
- ✅ No tracking or analytics
- ✅ No ads or miners
- ✅ Open source — inspect the code yourself!

## 📄 License

MIT License — feel free to use, modify, and share!

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Nigel1992">Nigel1992</a>
</p>
