# TRMNL Durham Waste Plugin - Step-by-Step Setup Guide

This guide will walk you through creating the Durham Waste Collection plugin on the TRMNL website.

---

## Prerequisites

✅ TRMNL account with Developer perks enabled  
✅ Your Durham Region address  
✅ Place ID from Recollect (we'll help you find this)

---

## Part 1: Find Your Place ID

### Option A: Using the Sample Data (Quick Test)

For initial testing, use the Place ID from our sample data:
```
918DB048-D91A-11E8-B83E-68F5AF88FEB0
```
Address: 1 King Street, Oshawa

### Option B: Find Your Own Place ID

1. **Visit Durham Region Waste Calendar**
   - Go to: https://www.durham.ca/en/living-here/collection-calendar.aspx
   - Enter your address
   - Click "Find my Collection Day"

2. **Open Browser Developer Tools**
   - Press `F12` or right-click → "Inspect"
   - Go to the **Network** tab
   - Reload the page if needed

3. **Find the API Call**
   - Look for a request to `api.recollect.net`
   - Find one that includes `/api/places/` in the URL
   - The Place ID is the long UUID in the URL format:
     ```
     https://api.recollect.net/api/places/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX/...
     ```
   - Copy the UUID (36 characters with dashes)

---

## Part 2: Create the Plugin on TRMNL

### Step 1: Navigate to Private Plugins

1. Log in to https://usetrmnl.com
2. Click on **Plugins** in the top navigation
3. Search for "**Private Plugin**" or scroll to find it
4. Click **"Add Plugin"** or **"Configure"**

### Step 2: Configure Basic Settings

Fill out the plugin configuration form:

**1. Plugin Name:**
```
Durham Waste Collection
```

**2. Strategy:**
- Select: **Polling**

**3. Polling URL:**
```
https://api.recollect.net/api/places/{{ place_id }}/services/{{ service_id }}/events?nomerge=1&hide=reminder_only&after={{ "now" | date: "%Y-%m-%d" }}&before={{ "now" | date: "%s" | plus: 2592000 | date: "%Y-%m-%d" }}&locale=en
```

**4. Polling Verb:**
- Select: **GET**

**5. Polling Headers (optional but recommended):**
```
user-agent=TRMNL-Durham-Waste/1.0
```

**6. Polling Body:**
- Leave empty (not needed for GET requests)

### Step 3: Create Form Fields

Click on **"Form Fields"** section and paste this YAML:

```yaml
- keyname: place_id
  field_type: string
  name: Place ID
  description: Your unique location ID from Recollect. Find it using the instructions in the setup guide.
  placeholder: "918DB048-D91A-11E8-B83E-68F5AF88FEB0"

- keyname: service_id
  field_type: string
  name: Service ID
  description: The waste collection service ID (usually 257 for Durham Region)
  placeholder: "257"

- keyname: address
  field_type: string
  name: Display Address
  description: A friendly name for your location to show on the display
  placeholder: "1 King Street, Oshawa"
  optional: true
```

### Step 4: Save Initial Configuration

- Scroll down and click **"Save"** button
- You should see a success message

---

## Part 3: Design the Plugin Markup

### Step 1: Open Markup Editor

1. From your plugin's settings page, click **"Edit Markup"** button
2. You'll see multiple tabs: Full, Half, Quarter, Shared
3. Start with the **"Full"** tab

### Step 2: Add the Full View Markup

**Delete any existing code** in the Full tab and paste this:

```liquid
{% comment %}
  Durham Waste Collection Plugin - Full View
  Shows next pickup date and all collection types
{% endcomment %}

{% assign today = "now" | date: "%Y-%m-%d" %}
{% assign next_events = events | where_exp: "event", "event.day >= today" | sort: "day" %}

{% if next_events.size == 0 %}
  {%- comment -%} No upcoming events {%- endcomment -%}
  <div class="layout flex items-center justify-center">
    <div class="text-center">
      <div class="title size-xl">📅</div>
      <div class="title mt-4">No Upcoming Pickups</div>
      <div class="description mt-2">Check back later for your schedule</div>
    </div>
  </div>
{% else %}
  {% assign next_date = next_events.first.day %}
  {% assign next_pickup_events = next_events | where: "day", next_date %}
  
  {%- comment -%} Calculate days until pickup {%- endcomment -%}
  {% assign next_timestamp = next_date | date: "%s" %}
  {% assign today_timestamp = today | date: "%s" %}
  {% assign seconds_diff = next_timestamp | minus: today_timestamp %}
  {% assign days_until = seconds_diff | divided_by: 86400 %}
  
  <div class="layout">
    {%- comment -%} Title Bar {%- endcomment -%}
    <div class="title-bar">
      <div class="title-bar__title">Next Pickup</div>
      <div class="title-bar__subtitle">
        {% if days_until == 0 %}
          Today - Set out before 7 AM
        {% elsif days_until == 1 %}
          Tomorrow ({{ next_date | date: "%a, %b %-d" }})
        {% else %}
          {{ days_until }} days ({{ next_date | date: "%a, %b %-d" }})
        {% endif %}
      </div>
    </div>

    {%- comment -%} Large Icon Display {%- endcomment -%}
    <div class="flex flex--row flex--center-x flex--center-y gap mt-8">
      {% for event in next_pickup_events %}
        {% for flag in event.flags %}
          <div class="text-center" style="width: 120px;">
            <div style="width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
              {% if flag.name == "recycling" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="120" height="120">
              {% elsif flag.name == "GreenBin" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="120" height="120">
              {% elsif flag.name == "garbage" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="120" height="120">
              {% elsif flag.name == "yardwaste" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="120" height="120">
              {% elsif flag.name == "pumpkins" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="120" height="120">
              {% else %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="120" height="120">
              {% endif %}
            </div>
            <div class="description font-weight-bold mt-2" style="width: 120px; text-align: center;">{{ flag.subject }}</div>
          </div>
        {% endfor %}
      {% endfor %}
    </div>

    {%- comment -%} Footer: Zone & Upcoming {%- endcomment -%}
    <div class="mt-auto pt-6">
      <div class="divider"></div>
      <div class="flex items-center justify-between pt-3">
        {% assign zone_id = next_pickup_events.first.zone_id | to_s %}
        {% assign zone = zones[zone_id] %}
        {% if zone %}
          <div class="description text-xs">{{ zone.title }}</div>
        {% endif %}
        
        {% assign unique_dates = next_events | map: "day" | uniq %}
        {% if unique_dates.size > 1 %}
          {% assign next_next_date = unique_dates[1] %}
          <div class="description text-xs">Next: {{ next_next_date | date: "%b %-d" }}</div>
        {% endif %}
      </div>
    </div>
  </div>
{% endif %}
```

### Step 3: Test with Force Refresh

1. **Fill in Form Fields** (bottom right of markup editor):
   - Place ID: `918DB048-D91A-11E8-B83E-68F5AF88FEB0`
   - Service ID: `257`
   - Display Address: `1 King Street, Oshawa` (optional)

2. **Click "Force Refresh"** button (top right area)
   - This fetches live data from the API
   - Wait a few seconds for the preview to update

3. **Check the Preview**
   - You should see the next pickup date (Nov 13, 2025)
   - Blue Box and Green Bin should be listed
   - Upcoming schedule in the sidebar

#### 🧪 Testing All Icon Variations

To visually test all collection type icons, **temporarily replace** the icon display section with this hardcoded version:

```liquid
{%- comment -%} 🧪 TESTING: All Icons Display - Remove after testing {%- endcomment -%}
<div class="flex flex--row flex--center-x flex--center-y gap mt-8">
  <div class="text-center" style="width: 120px;">
    <div style="width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
      <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="120" height="120">
    </div>
    <div class="description font-weight-bold mt-2" style="width: 120px; text-align: center;">Blue Box</div>
  </div>
  <div class="text-center" style="width: 120px;">
    <div style="width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
      <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="120" height="120">
    </div>
    <div class="description font-weight-bold mt-2" style="width: 120px; text-align: center;">Green Bin</div>
  </div>
  <div class="text-center" style="width: 120px;">
    <div style="width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
      <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="120" height="120">
    </div>
    <div class="description font-weight-bold mt-2" style="width: 120px; text-align: center;">Garbage</div>
  </div>
  <div class="text-center" style="width: 120px;">
    <div style="width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
      <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="120" height="120">
    </div>
    <div class="description font-weight-bold mt-2" style="width: 120px; text-align: center;">Yard Waste</div>
  </div>
  <div class="text-center" style="width: 120px;">
    <div style="width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;">
      <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="120" height="120">
    </div>
    <div class="description font-weight-bold mt-2" style="width: 120px; text-align: center;">Pumpkins</div>
  </div>
</div>
```

**Note:** Adjust icon size (120px for Full, 80px for Half, 72px for Quarter, 56px for Third) based on which view you're testing. Remember to restore the original looping code after visual testing!



### Step 4: Add Half View Markup

Click on the **"Half"** tab and add this optimized version for mashup layouts (both horizontal and vertical halves):

```liquid
{% comment %}
  Durham Waste Collection Plugin - Half View
  Works for both half_vertical (left/right) and half_horizontal (top/bottom)
{% endcomment %}

{% assign today = "now" | date: "%Y-%m-%d" %}
{% assign next_events = events | where_exp: "event", "event.day >= today" | sort: "day" %}

{% if next_events.size == 0 %}
  <div class="layout flex items-center justify-center">
    <div class="text-center">
      <div class="title">No Pickups</div>
      <div class="description mt-2">Check schedule</div>
    </div>
  </div>
{% else %}
  {% assign next_date = next_events.first.day %}
  {% assign next_pickup_events = next_events | where: "day", next_date %}
  
  {% assign next_timestamp = next_date | date: "%s" %}
  {% assign today_timestamp = today | date: "%s" %}
  {% assign days_until = next_timestamp | minus: today_timestamp | divided_by: 86400 %}
  
  <div class="layout">
    <div class="title-bar">
      <div class="title-bar__title">Next Pickup</div>
      <div class="title-bar__subtitle">
        {% if days_until == 0 %}Today
        {% elsif days_until == 1 %}Tomorrow
        {% else %}{{ days_until }} days
        {% endif %} - {{ next_date | date: "%b %-d" }}
      </div>
    </div>

    {%- comment -%} Large Icons Centered {%- endcomment -%}
    <div class="flex flex--row flex--center-x flex--center-y gap mt-6">
      {% for event in next_pickup_events %}
        {% for flag in event.flags %}
          <div class="text-center" style="width: 80px;">
            <div style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
              {% if flag.name == "recycling" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="80" height="80">
              {% elsif flag.name == "GreenBin" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="80" height="80">
              {% elsif flag.name == "garbage" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="80" height="80">
              {% elsif flag.name == "yardwaste" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="80" height="80">
              {% elsif flag.name == "pumpkins" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="80" height="80">
              {% else %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="80" height="80">
              {% endif %}
            </div>
            <div class="description font-weight-bold mt-1 text-sm" style="width: 80px; text-align: center;">{{ flag.subject }}</div>
          </div>
        {% endfor %}
      {% endfor %}
    </div>
  </div>
{% endif %}
```

### Step 5: Add Quarter View Markup

Click on the **"Quarter"** tab for compact quadrant layouts (1/4 screen size):

```liquid
{% comment %}
  Durham Waste Collection Plugin - Quarter View
  Ultra-compact for 2x2 grid mashups - optimized for icon-first display
{% endcomment %}

{% assign today = "now" | date: "%Y-%m-%d" %}
{% assign next_events = events | where_exp: "event", "event.day >= today" | sort: "day" %}

{% if next_events.size == 0 %}
  <div class="layout flex items-center justify-center">
    <div class="text-center">
      <div class="description">No Pickups</div>
    </div>
  </div>
{% else %}
  {% assign next_date = next_events.first.day %}
  {% assign next_pickup_events = next_events | where: "day", next_date %}
  
  {% assign next_timestamp = next_date | date: "%s" %}
  {% assign today_timestamp = today | date: "%s" %}
  {% assign days_until = next_timestamp | minus: today_timestamp | divided_by: 86400 %}
  
  <div class="layout">
    {%- comment -%} Compact Title at Top {%- endcomment -%}
    <div class="text-center mb-2">
      <div class="label text-xs">Next Pickup</div>
      <div class="title text-sm">
        {% if days_until == 0 %}Today
        {% elsif days_until == 1 %}Tomorrow
        {% else %}{{ next_date | date: "%b %-d" }}
        {% endif %}
      </div>
    </div>

    {%- comment -%} Large Icon Display - Optimized for Quarter View {%- endcomment -%}
    <div class="flex flex--row flex--center-x flex--center-y gap mt-2">
      {% for event in next_pickup_events %}
        {% for flag in event.flags %}
          <div class="text-center" style="width: 72px;">
            <div style="width: 72px; height: 72px; display: flex; align-items: center; justify-content: center;">
              {% if flag.name == "recycling" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="72" height="72">
              {% elsif flag.name == "GreenBin" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="72" height="72">
              {% elsif flag.name == "garbage" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="72" height="72">
              {% elsif flag.name == "yardwaste" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="72" height="72">
              {% elsif flag.name == "pumpkins" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="72" height="72">
              {% else %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="72" height="72">
              {% endif %}
            </div>
            <div class="description text-xs mt-1" style="width: 72px; text-align: center;">{{ flag.subject }}</div>
          </div>
        {% endfor %}
      {% endfor %}
    </div>
  </div>
{% endif %}
```

### Step 6: Add Third View Markup

Click on the **"Third"** tab for 3-way layouts (1/3 screen size):

```liquid
{% comment %}
  Durham Waste Collection Plugin - Third View
  Compact for 3-plugin mashups
{% endcomment %}

{% assign today = "now" | date: "%Y-%m-%d" %}
{% assign next_events = events | where_exp: "event", "event.day >= today" | sort: "day" %}

{% if next_events.size == 0 %}
  <div class="layout flex items-center justify-center">
    <div class="text-center">
      <div class="description text-sm">No Pickups</div>
    </div>
  </div>
{% else %}
  {% assign next_date = next_events.first.day %}
  {% assign next_pickup_events = next_events | where: "day", next_date %}
  
  {% assign next_timestamp = next_date | date: "%s" %}
  {% assign today_timestamp = today | date: "%s" %}
  {% assign days_until = next_timestamp | minus: today_timestamp | divided_by: 86400 %}
  
  <div class="layout">
    <div class="item">
      <div class="label">Next Pickup</div>
      <div class="title">
        {% if days_until == 0 %}Today
        {% elsif days_until == 1 %}Tomorrow
        {% else %}{{ days_until }} days
        {% endif %}
      </div>
      <div class="description text-xs">{{ next_date | date: "%b %-d" }}</div>
    </div>

    {%- comment -%} Medium Icons Centered {%- endcomment -%}
    <div class="flex flex--row flex--center-x flex--center-y gap mt-3">
      {% for event in next_pickup_events %}
        {% for flag in event.flags %}
          <div class="text-center" style="width: 56px;">
            <div style="width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
              {% if flag.name == "recycling" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="56" height="56">
              {% elsif flag.name == "GreenBin" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="56" height="56">
              {% elsif flag.name == "garbage" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="56" height="56">
              {% elsif flag.name == "yardwaste" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="56" height="56">
              {% elsif flag.name == "pumpkins" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="56" height="56">
              {% else %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="56" height="56">
              {% endif %}
            </div>
            <div class="description text-xs mt-1" style="width: 56px; text-align: center;">{{ flag.subject }}</div>
          </div>
        {% endfor %}
      {% endfor %}
    </div>
  </div>
{% endif %}
```

### Step 7: Save All Markup Variations

1. Make sure you've added markup to **all tabs**: Full, Half, Quarter, Third
2. Click **"Save"** button in the markup editor for each tab
3. Wait for confirmation message

1. Click **"Save"** button in the markup editor
2. Wait for confirmation message

---

## Part 4: Add Plugin to Your Device

### Step 1: Create/Edit a Playlist

1. Go to **Playlists** in top navigation
2. Either create a new playlist or edit an existing one
3. Click **"Add Plugin"**

### Step 2: Add Your Plugin

1. Search for "Durham Waste Collection" (your private plugin name)
2. Click to add it
3. Configure the instance:
   - **Place ID**: Enter your Place ID
   - **Service ID**: Enter `257` (or your service ID)
   - **Display Address**: Enter your address (optional)
4. Click **"Save"**

### Step 3: Assign to Device

1. Make sure the playlist is assigned to your TRMNL device
2. Set the refresh schedule (e.g., every 6 hours)

### Step 4: Force Refresh (Testing)

1. Go back to **Plugins** → Your plugin
2. Click **"Force Refresh"** to generate a new screen
3. Check the preview shows correct data

---

## Part 5: Verify on Device

### Expected Timeline

- **Immediate**: Preview available in plugin settings
- **Next Refresh**: Plugin appears on device (based on playlist schedule)
- **Manual**: Use device buttons to cycle through plugins

### What You Should See

✅ Plugin title: "Waste Collection"  
✅ Next pickup date: "Thursday, November 13"  
✅ Days until: "In 4 days"  
✅ Collection types: Blue Box ♻️, Green Bin 🗑️  
✅ Upcoming dates in sidebar  
✅ Zone name at bottom  

---

## Troubleshooting

### Problem: "No data" or blank preview

**Solution:**
1. Check Place ID is correct (36 characters with dashes)
2. Click "Force Refresh" button
3. Check "Your Variables" dropdown to see if data loaded
4. Verify polling URL has proper format

### Problem: "Invalid liquid syntax" error

**Solution:**
1. Check all `{% %}` tags are properly closed
2. Make sure no curly quotes (use straight quotes)
3. Verify variable names match the API response

### Problem: API returns empty events array

**Solution:**
1. Verify Place ID is for Durham Region
2. Check service ID is 257 (Durham waste)
3. Try removing date filters temporarily to see all events
4. Test the API URL directly in browser

### Problem: Data shows but layout is broken

**Solution:**
1. Make sure you're using TRMNL Framework v2 classes
2. Check the Framework docs: https://usetrmnl.com/framework
3. Verify `<div class="layout">` wraps your content
4. Use live preview to iterate on design

### Problem: Plugin not showing on device

**Solution:**
1. Verify plugin is added to an active playlist
2. Check playlist is assigned to your device
3. Wait for next scheduled refresh OR use device buttons
4. Check device logs/status page

---

## Testing with Different Dates

To test how the plugin looks with different timing:

1. **Today's Pickup**: Use the sample Place ID on Nov 13, 2025
2. **Tomorrow**: Adjust system date in browser DevTools
3. **Multiple Collections**: Current sample shows Blue Box + Green Bin together

---

## Next Steps

### Enhance Your Plugin

1. **Add Quarter View**: Create compact version for 3+ plugin mashups
2. **Custom Styling**: Add CSS to match your preferences
3. **More Data**: Show zone description, repeat frequency
4. **Error States**: Better handling for API failures

### Share Your Work

1. Click **"Publish as Recipe"** from plugin settings
2. TRMNL team will review (usually 1-2 days)
3. Join Developer Discord for feedback
4. Share on social media with #TRMNL

---

## Quick Reference

### Your Plugin URLs

- **Edit Plugin**: Plugins → Durham Waste Collection → Settings
- **Edit Markup**: Plugin Settings → Edit Markup button
- **Force Refresh**: Plugin Settings → Force Refresh button
- **Preview**: Shows automatically after Force Refresh

### Important API Parameters

- `place_id`: Your location UUID
- `service_id`: Service ID (257 for Durham Region waste)
- `nomerge=1`: Return separate events (important!)
- `after={{ "now" | date: "%Y-%m-%d" }}`: Only future events

### Key Liquid Filters

- `{{ date | date: "%Y-%m-%d" }}`: Format date
- `{{ array | where: "key", value }}`: Filter array
- `{{ array | sort: "key" }}`: Sort array
- `{{ number | divided_by: 86400 }}`: Convert seconds to days

---

## Support Resources

- **TRMNL Help**: https://help.usetrmnl.com
- **Developer Discord**: Link in your Account page
- **Framework Docs**: https://usetrmnl.com/framework
- **This Project**: Check TECHNICAL_SPECIFICATION.md for details

---

## Checklist

Before marking complete, verify:

- [ ] Developer perks enabled on TRMNL account
- [ ] Place ID obtained and verified
- [ ] Plugin created with Polling strategy
- [ ] Form fields configured (place_id, service_id, address)
- [ ] Polling URL with proper parameters
- [ ] Full view markup added and saved
- [ ] Force Refresh successful with preview
- [ ] Plugin added to a playlist
- [ ] Playlist assigned to device
- [ ] Preview shows correct next pickup date
- [ ] All collection types displayed with icons
- [ ] No console errors in markup editor

---

**Congratulations! 🎉** 

Your Durham Waste Collection plugin is now live. It will automatically refresh based on your playlist schedule and always show the next upcoming pickup.

**Pro Tip**: Set your device to refresh early morning (e.g., 6 AM) so you always see current info before pickup day!
