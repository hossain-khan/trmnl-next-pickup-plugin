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
      <div class="title-bar__title">Waste Collection</div>
      <div class="title-bar__subtitle">{{ address | default: "Durham Region" }}</div>
    </div>

    <div class="columns gap-4">
      {%- comment -%} Main: Next Pickup Info {%- endcomment -%}
      <div class="column">
        <div class="item">
          <div class="label">Next Pickup</div>
          <div class="title size-xl mt-1">
            {{ next_date | date: "%A, %B %-d" }}
          </div>
          <div class="description mt-1">
            {% if days_until == 0 %}
              🔔 Today - Set out before 7 AM
            {% elsif days_until == 1 %}
              Tomorrow
            {% else %}
              In {{ days_until }} days
            {% endif %}
          </div>
        </div>

        {%- comment -%} Collection Types {%- endcomment -%}
        <div class="mt-4">
          <div class="label mb-2">What's Being Collected</div>
          
          {% for event in next_pickup_events %}
            {% for flag in event.flags %}
              <div class="item flex items-center gap-3 py-2 border-b">
                <div style="min-width: 48px; max-width: 48px;">
                  {% if flag.name == "recycling" %}
                    <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="48" height="48">
                  {% elsif flag.name == "GreenBin" %}
                    <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="48" height="48">
                  {% elsif flag.name == "garbage" %}
                    <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="48" height="48">
                  {% elsif flag.name == "yardwaste" %}
                    <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="48" height="48">
                  {% elsif flag.name == "pumpkins" %}
                    <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="48" height="48">
                  {% else %}
                    <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="48" height="48">
                  {% endif %}
                </div>
                <div>
                  <div class="description font-weight-bold">{{ flag.subject }}</div>
                </div>
              </div>
            {% endfor %}
          {% endfor %}
        </div>
      </div>

      {%- comment -%} Sidebar: Upcoming Dates {%- endcomment -%}
      <div class="column">
        <div class="label mb-2">Upcoming Schedule</div>
        
        {% assign unique_dates = next_events | map: "day" | uniq %}
        {% assign future_dates = unique_dates | slice: 1, 4 %}
        
        {% for date in future_dates %}
          {% assign date_events = next_events | where: "day", date %}
          <div class="item py-2 {% if forloop.last == false %}border-b{% endif %}">
            <div class="description font-weight-bold">{{ date | date: "%b %-d" }}</div>
            <div class="description text-xs mt-1">
              {% for evt in date_events limit: 1 %}
                {% for flag in evt.flags limit: 2 %}
                  {{ flag.subject }}{% unless forloop.last %}, {% endunless %}
                {% endfor %}
                {% if evt.flags.size > 2 %}+{{ evt.flags.size | minus: 2 }}{% endif %}
              {% endfor %}
            </div>
          </div>
        {% endfor %}
      </div>
    </div>

    {%- comment -%} Footer: Zone Info {%- endcomment -%}
    {% assign zone_id = next_pickup_events.first.zone_id | to_s %}
    {% assign zone = zones[zone_id] %}
    {% if zone %}
      <div class="mt-auto pt-4">
        <div class="divider"></div>
        <div class="description text-center text-xs pt-2">
          {{ zone.title }}
        </div>
      </div>
    {% endif %}
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
    </div>

    <div class="item">
      <div class="title size-lg">{{ next_date | date: "%a, %b %-d" }}</div>
      <div class="description">
        {% if days_until == 0 %}Today
        {% elsif days_until == 1 %}Tomorrow
        {% else %}In {{ days_until }} days
        {% endif %}
      </div>
    </div>

    <div class="mt-3">
      {% for event in next_pickup_events %}
        {% for flag in event.flags %}
          <div class="flex items-center gap-2 py-1">
            <div style="min-width: 32px; max-width: 32px;">
              {% if flag.name == "recycling" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="32" height="32">
              {% elsif flag.name == "GreenBin" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="32" height="32">
              {% elsif flag.name == "garbage" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="32" height="32">
              {% elsif flag.name == "yardwaste" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="32" height="32">
              {% elsif flag.name == "pumpkins" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="32" height="32">
              {% else %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="32" height="32">
              {% endif %}
            </div>
            <span class="description text-sm">{{ flag.subject }}</span>
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
  Ultra-compact for 2x2 grid mashups
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
    <div class="item">
      <div class="label">Next Pickup</div>
      <div class="title">{{ next_date | date: "%b %-d" }}</div>
      <div class="description text-xs">
        {% if days_until == 0 %}Today
        {% elsif days_until == 1 %}Tomorrow
        {% else %}{{ days_until }} days
        {% endif %}
      </div>
    </div>

    <div class="mt-2">
      {% for event in next_pickup_events %}
        {% for flag in event.flags %}
          <div class="flex items-center gap-1 py-1">
            <div style="min-width: 24px; max-width: 24px;">
              {% if flag.name == "recycling" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="24" height="24">
              {% elsif flag.name == "GreenBin" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="24" height="24">
              {% elsif flag.name == "garbage" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="24" height="24">
              {% elsif flag.name == "yardwaste" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="24" height="24">
              {% elsif flag.name == "pumpkins" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="24" height="24">
              {% else %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="24" height="24">
              {% endif %}
            </div>
            <span class="description text-xs">{{ flag.subject }}</span>
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
      <div class="title">{{ next_date | date: "%b %-d" }}</div>
      <div class="description text-xs">
        {% if days_until == 0 %}Today
        {% elsif days_until == 1 %}Tomorrow
        {% else %}{{ days_until }} days
        {% endif %}
      </div>
    </div>

    <div class="mt-2">
      {% for event in next_pickup_events %}
        {% for flag in event.flags %}
          <div class="flex items-center gap-2 py-1">
            <div style="min-width: 28px; max-width: 28px;">
              {% if flag.name == "recycling" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="28" height="28">
              {% elsif flag.name == "GreenBin" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="28" height="28">
              {% elsif flag.name == "garbage" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="28" height="28">
              {% elsif flag.name == "yardwaste" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="28" height="28">
              {% elsif flag.name == "pumpkins" %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="28" height="28">
              {% else %}
                <img class="image image-dither" src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="28" height="28">
              {% endif %}
            </div>
            <span class="description text-xs">{{ flag.subject }}</span>
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
