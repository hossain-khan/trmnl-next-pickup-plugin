# Durham Waste Collection - TRMNL Plugin Setup

Never miss your garbage, recycling, or green bin pickup day! This plugin displays your Durham Region collection schedule directly on your TRMNL e-ink display.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Your Configuration

Visit our **Configuration Helper** to automatically find your Place ID:

👉 **https://hossain-khan.github.io/trmnl-next-pickup-plugin/**

1. Enter your Durham Region address
2. Click "Find My Configuration"
3. Copy the three values (Place ID, Service ID, Display Address)

![Configuration Helper Demo](resources/recipe-configuration.gif)

---

### Step 2: Add Private Plugin on TRMNL

1. Go to [TRMNL Plugins](https://usetrmnl.com/plugins)
2. Search for **"Private Plugin"** and add it
3. Configure the plugin:
   - **Plugin Name:** `Durham Waste Collection`
   - **Strategy:** Polling
   - **Polling URL:**
     ```
     https://api.recollect.net/api/places/{{ place_id }}/services/{{ service_id }}/events?nomerge=1&hide=reminder_only&after={{ "now" | date: "%Y-%m-%d" }}&before={{ "now" | date: "%s" | plus: 2592000 | date: "%Y-%m-%d" }}&locale=en
     ```
   - **Polling Verb:** GET

4. Add form fields (paste this YAML):
   ```yaml
   - keyname: place_id
     field_type: string
     name: Place ID
     description: Your unique location ID from Recollect
     placeholder: "918DB048-D91A-11E8-B83E-68F5AF88FEB0"
   
   - keyname: service_id
     field_type: string
     name: Service ID
     description: Durham waste collection service ID
     placeholder: "257"
   
   - keyname: address
     field_type: string
     name: Display Address
     description: Address to show on your display
     placeholder: "1 King Street, Oshawa"
     optional: true
   ```

5. Save the configuration

---

### Step 3: Add Plugin Markup

Visit the [Configuration Helper](https://hossain-khan.github.io/trmnl-next-pickup-plugin/) for ready-to-use markup templates for:
- ✅ Full view (800×480)
- ✅ Half view (400×480 and 800×240)
- ✅ Quarter view (400×240)
- ✅ Third view (266×480)

Copy the markup, paste it into your plugin's markup editor, and save!

---

## ✨ Features

- 🗓️ **Real-time Updates** - Automatic polling from Durham Region API
- ♻️ **All Collection Types** - Blue Box, Green Bin, Garbage, Yard Waste, seasonal items
- 📱 **Multiple Layouts** - Full, Half, Quarter, and Third view sizes
- 🎨 **Beautiful Icons** - Visual indicators for each collection type
- ⏰ **Countdown Display** - Shows days until next pickup

---

## 📋 Requirements

- TRMNL device with Developer perks enabled
- Durham Region, Ontario address
- Place ID from Recollect (use our [Configuration Helper](https://hossain-khan.github.io/trmnl-next-pickup-plugin/))

---

## 🆘 Need Help?

- **Configuration Helper:** https://hossain-khan.github.io/trmnl-next-pickup-plugin/
- **Technical Setup Guide:** [PLUGIN_SETUP_GUIDE.md](resources/PLUGIN_SETUP_GUIDE.md)
- **Technical Specification:** [TECHNICAL_SPECIFICATION.md](resources/TECHNICAL_SPECIFICATION.md)
- **GitHub Issues:** [Report a problem](https://github.com/hossain-khan/trmnl-next-pickup-plugin/issues)

---

## 🎉 That's It!

Your plugin is ready! It will automatically refresh based on your playlist schedule and always show your next pickup date.

**Pro Tip:** Set your TRMNL to refresh early morning (e.g., 6 AM) so you always see current info before pickup day!

---

Made with ❤️ for [TRMNL](https://usetrmnl.com) | [View on GitHub](https://github.com/hossain-khan/trmnl-next-pickup-plugin)
