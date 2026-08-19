[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Nigel1992)

# 🌍 Vinted Geolocator

![Version](https://img.shields.io/badge/version-1.4.8-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow?style=for-the-badge&logo=javascript&logoColor=white)

> Reveal hidden seller locations on Vinted and filter items by country with intelligent caching and a beautiful, intuitive UI.

<img width="1179" height="601" alt="image" src="https://greasyfork.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6MjA0MTQyLCJwdXIiOiJibG9iX2lkIn19--cbe480cee924bfc7bfe4c1d50c14ffbea3b50d15/Screenshot_2026-01-17_22-29-05.png?locale=en" />

## ✨ Features

- **🏳️ Country Flags** — Instantly see where each item ships from with flag badges
- **🔍 Smart Filtering** — Filter items by country with a single click
- **💾 Intelligent Caching** — Location data is cached forever, no repeated API calls
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
2. For each item, it first checks cached location data, then fetches from Vinted's API if needed
3. Location data is cached forever to avoid repeated API calls
4. Country flags are added to item cards
5. Use the floating panel to filter by your preferred country
6. Non-matching items fade out, keeping your focus on relevant listings

## ⚠️ Important Notes

- **Language**: Set Vinted to **English** for the script to work correctly
- **Rate Limits**: The script respects Vinted's API limits.
- **Visual Only**: Filtering is purely visual — it doesn't affect Vinted's search results

## Recent Update

- **v1.4.8**: Fixed logged-in user detection to accommodate Vinted's changing CSS-module avatar class names.

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

## Support This Project

Support this project! All donations go towards your chosen charity. You can pick any charity you'd like, and I will ensure the funds are sent their way. Please note that standard payment processing fees (Ko-fi & PayPal) will be deducted from the total. As a thank you, your name will be listed as a supporter/donor in this project. Feel free to email me at thedjskywalker@gmail.com for proof of the donation or to let me know which charity you've selected!
