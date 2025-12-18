# TRMNL Next Pickup Plugin - Technical Specification

## Project Overview

This plugin displays upcoming waste collection events for Durham Region on a TRMNL e-ink display device. It will show the next scheduled pickup date along with the collection types (Blue Box, Green Bin, Garbage, Yard Waste, etc.).

---

## TRMNL Plugin Architecture

### Plugin Type: Private Plugin with Polling Strategy

**Rationale**: The Polling strategy is ideal because:
- TRMNL server fetches data on our behalf
- No need to maintain a separate webhook server
- Can leverage external waste collection API
- Automatic refresh scheduling

---

## Data Source

### API Endpoint
The plugin will poll the Recollect waste collection API:

```
https://api.recollect.net/api/places/{PLACE_ID}/services/{SERVICE_ID}/events
```

**Parameters:**
- `PLACE_ID`: User's location identifier (from place details)
- `SERVICE_ID`: Durham Region service ID (257)
- `nomerge=1`: Return separate events
- `hide=reminder_only`: Filter out reminder-only events
- `after={CURRENT_DATE}`: Filter events from today forward
- `before={END_DATE}`: Limit future date range (e.g., +30 days)
- `locale=en`: Language preference
- `include_message=email`: Include message content

### Data Structure

Based on `events.json`, the API returns:

```json
{
  "events": [
    {
      "day": "2025-11-13",
      "id": 26841849,
      "zone_id": 5882,
      "flags": [
        {
          "subject": "Blue Box",
          "name": "recycling",
          "icon": "blue-box.durham",
          "color": "#044dc8",
          "backgroundColor": "#044dc8",
          "textColor": "#ffffff",
          "event_type": "pickup",
          "sort_order": 5
        }
      ],
      "opts": {
        "repeat_data": {
          "frequency": "every two weeks",
          "start_day": "2024-07-11",
          "end_day": "2025-12-31"
        }
      }
    }
  ],
  "zones": {
    "5882": {
      "title": "Oshawa Thursday Area 2",
      "name": "durham-zone-oshawa-thursday-area-2"
    }
  }
}
```

---

## Plugin Configuration

### 1. Strategy Settings

**Strategy**: Polling

**Polling URL**:
```
https://api.recollect.net/api/places/{{ place_id }}/services/257/events?nomerge=1&hide=reminder_only&after={{ "now" | date: "%Y-%m-%d" }}&before={{ "now" | date: "%Y-%m-%d" | date: "%s" | plus: 2592000 | date: "%Y-%m-%d" }}&locale=en&include_message=email
```

**Polling Verb**: GET

**Polling Headers**: 
```
user-agent=TRMNL-Durham-Waste-Plugin/1.0
```

### 2. Form Fields (YAML)

Create a custom form for users to input their configuration and provide plugin information:

```yaml
- keyname: author_bio
  name: About This Plugin
  field_type: author_bio
  category: life,environment
  description: |
    Durham Waste Collection displays your next garbage, recycling, green bin, and yard waste pickup dates directly on your TRMNL device.
    <br><br>
    <strong>Features:</strong><br>
    🗓️ Real-time updates from Durham Region API<br>
    ♻️ All collection types (Blue Box, Green Bin, Garbage, Yard Waste)<br>
    📱 Optimized layouts for all TRMNL view sizes<br>
    🎨 Beautiful icons for each collection type<br>
    ⏰ Countdown display showing days until next pickup
    <br><br>
    <strong>Setup:</strong><br>
    1. Visit our Configuration Helper to find your Place ID: https://hossain-khan.github.io/trmnl-next-pickup-plugin/<br>
    2. Enter your Durham Region address<br>
    3. Copy the configuration values<br>
    4. Paste them into the plugin form fields below
    <br><br>
    That's it! Your plugin will automatically refresh with the latest pickup schedule.
    <br><br>
    <strong>Note:</strong> This plugin is designed for Durham Region, Ontario residents only.
  github_url: https://github.com/hossain-khan/trmnl-next-pickup-plugin
  learn_more_url: https://hossain-khan.github.io/trmnl-next-pickup-plugin/
  email_address: trmnl@hossain.dev

- keyname: place_id
  field_type: string
  name: Place ID
  description: Your unique location ID from Recollect. Find it easily at <a href="https://hossain-khan.github.io/trmnl-next-pickup-plugin/">our Configuration Helper</a>.
  placeholder: "918DB048-D91A-11E8-B83E-68F5AF88FEB0"

- keyname: service_id
  field_type: string
  name: Service ID
  description: Durham waste collection service ID
  placeholder: "257"
  
- keyname: address
  field_type: string
  name: Display Address
  description: A friendly name for your location to show on the display
  placeholder: "1 King Street, Oshawa"
  optional: true
```

**Important Notes:**
- The `author_bio` field is required when publishing as a Recipe
- It appears below the plugin's preview image on the recipe page
- Categories (`life,environment`) help users discover your plugin
- Special properties (`github_url`, `learn_more_url`, `email_address`) render as clickable icons

### 3. Plugin Settings

- **Name**: Durham Waste Collection
- **Remove Bleed Margin**: No (keep default padding)
- **Refresh Interval**: Automatic (TRMNL manages scheduling)

---

## Markup Design

### Layout Strategy

**Target**: TRMNL e-ink display (800x480 pixels, 1-bit rendering)

**Framework**: TRMNL Framework v2

### Data Processing Logic

1. **Filter Next Event**: Find the earliest event date >= current date
2. **Group by Date**: Combine all flags/collections for the same date
3. **Extract Collection Types**: Parse all `flags[]` for that date
4. **Format Display**: Show date + collection types with icons

### Liquid Template Structure

```liquid
{% comment %}
  Process events to find next pickup date and combine collection types
{% endcomment %}

{% assign today = "now" | date: "%Y-%m-%d" %}
{% assign next_events = events | where_exp: "event", "event.day >= today" | sort: "day" %}
{% assign next_date = next_events.first.day %}

{% comment %}
  Group all events for the next date
{% endcomment %}

{% assign next_pickup_events = next_events | where: "day", next_date %}

{% comment %}
  Calculate days until pickup
{% endcomment %}

{% assign next_date_timestamp = next_date | date: "%s" %}
{% assign today_timestamp = today | date: "%s" %}
{% assign days_until = next_date_timestamp | minus: today_timestamp | divided_by: 86400 %}
```

### HTML Structure

**Key Changes from Mario's Review Feedback:**
1. **Typography Hierarchy**: Use `title--small` for labels and `value` for countdown
2. **Inline SVG Icons**: Embed SVGs using capture + base64_encode pattern (no external URLs)
3. **Flex Classes**: Use `flex` classes instead of nested `layout` (Framework violation)
4. **No Inline Styles**: Replace with Framework spacing/sizing classes
5. **Title Bar Fix**: Remove `min-height: 100%` that prevents title_bar rendering

**Shared View - SVG Icon Library:**
```liquid
{%- capture svg_recycle_bin -%}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 136 136">
  <path d="M68 0C30.4 0 0 30.4 0 68s30.4 68 68 68 68-30.4 68-68S105.6 0 68 0zm0 8c33.1 0 60 26.9 60 60s-26.9 60-60 60S8 101.1 8 68 34.9 8 68 8z" fill="currentColor"/>
  <path d="M45 32l-8 12h62l-8-12H45zm-12 16v8h70v-8H33zm4 12v44c0 2.2 1.8 4 4 4h54c2.2 0 4-1.8 4-4V60H37zm16 8h6v28h-6V68zm14 0h6v28h-6V68zm14 0h6v28h-6V68z" fill="currentColor"/>
</svg>
{%- endcapture -%}

{%- capture svg_green_recycle_bin -%}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 136 136">
  <circle cx="68" cy="68" r="60" fill="#4CAF50" stroke="currentColor" stroke-width="2"/>
  <path d="M45 32l-8 12h62l-8-12H45zm-12 16v8h70v-8H33zm4 12v44c0 2.2 1.8 4 4 4h54c2.2 0 4-1.8 4-4V60H37zm16 8h6v28h-6V68zm14 0h6v28h-6V68zm14 0h6v28h-6V68z" fill="#fff"/>
</svg>
{%- endcapture -%}

{%- capture svg_garbage_bag -%}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 136 136">
  <path d="M68 8c-6.6 0-12 5.4-12 12v8H44c-4.4 0-8 3.6-8 8v80c0 8.8 7.2 16 16 16h56c8.8 0 16-7.2 16-16V36c0-4.4-3.6-8-8-8H104v-8c0-6.6-5.4-12-12-12H68zm0 8h24c2.2 0 4 1.8 4 4v8H64v-8c0-2.2 1.8-4 4-4zM44 36h88v80c0 4.4-3.6 8-8 8H52c-4.4 0-8-3.6-8-8V36z" fill="currentColor"/>
</svg>
{%- endcapture -%}

{%- capture svg_yard_waste -%}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 136 136">
  <path d="M68 12c-4.4 0-8 3.6-8 8v8c-12.1 2.2-22.4 9.9-28 20.5C26.4 60.1 24 72.8 24 88v28c0 4.4 3.6 8 8 8h72c4.4 0 8-3.6 8-8V88c0-15.2-2.4-27.9-8-39.5-5.6-10.6-15.9-18.3-28-20.5v-8c0-4.4-3.6-8-8-8zm0 24c10.5 0 19.5 6.7 24.5 16S100 72.3 100 88v20H36V88c0-15.7 2.5-26.3 7.5-36S57.5 36 68 36zm-20 80h40v8H48v-8z" fill="#8BC34A"/>
  <path d="M68 48c-2.2 0-4 1.8-4 4v24l-8-8c-1.6-1.6-4.1-1.6-5.7 0s-1.6 4.1 0 5.7l16 16c1.6 1.6 4.1 1.6 5.7 0l16-16c1.6-1.6 1.6-4.1 0-5.7s-4.1-1.6-5.7 0l-8 8V52c0-2.2-1.8-4-4-4z" fill="#fff"/>
</svg>
{%- endcapture -%}

{%- capture svg_pumpkin -%}
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 136 136">
  <ellipse cx="68" cy="76" rx="44" ry="48" fill="#FF9800"/>
  <path d="M68 28c-2.2 0-4 1.8-4 4v16c0 2.2 1.8 4 4 4s4-1.8 4-4V32c0-2.2-1.8-4-4-4z" fill="#4CAF50"/>
  <path d="M40 64c-2.2 0-4 1.8-4 4v16c0 13.3 14.3 24 32 24s32-10.7 32-24V68c0-2.2-1.8-4-4-4s-4 1.8-4 4v16c0 8.8-10.7 16-24 16s-24-7.2-24-16V68c0-2.2-1.8-4-4-4z" fill="#F57C00"/>
  <ellipse cx="56" cy="72" rx="6" ry="8" fill="#333"/>
  <ellipse cx="80" cy="72" rx="6" ry="8" fill="#333"/>
</svg>
{%- endcapture -%}
```

**Full View Example (Corrected):**
```liquid
<div class="flex flex--col flex--center-x flex--center-y gap-lg">
  {%- comment -%} Typography hierarchy: title--small + value {%- endcomment -%}
  <div class="flex flex--col flex--center-x gap-xxs">
    <div class="title--small">Next Pickup</div>
    <div class="value">
      {% if days_until == 0 %}Today
      {% elsif days_until == 1 %}Tomorrow
      {% else %}In {{ days_until }} days
      {% endif %}
    </div>
    <div class="description">{{ next_date | date: "%A, %B %-d" }}</div>
  </div>

  {%- comment -%} Icon Display - Framework flex classes {%- endcomment -%}
  <div class="flex flex--row flex--center-x flex--wrap gap-lg px-lg py-lg bg-1">
    {% for event in next_pickup_events %}
      {% for flag in event.flags %}
        <div class="flex flex--col flex--center-x gap-xs">
          <div>
            <img 
              {% if flag.name == "recycling" %}
                src="data:image/svg+xml;base64,{{ svg_recycle_bin | base64_encode }}" alt="Blue Box"
              {% elsif flag.name == "GreenBin" %}
                src="data:image/svg+xml;base64,{{ svg_green_recycle_bin | base64_encode }}" alt="Green Bin"
              {% elsif flag.name == "garbage" %}
                src="data:image/svg+xml;base64,{{ svg_garbage_bag | base64_encode }}" alt="Garbage"
              {% elsif flag.name == "yardwaste" %}
                src="data:image/svg+xml;base64,{{ svg_yard_waste | base64_encode }}" alt="Yard Waste"
              {% elsif flag.name == "pumpkins" %}
                src="data:image/svg+xml;base64,{{ svg_pumpkin | base64_encode }}" alt="Pumpkins"
              {% endif %}
              width="136" height="136" />
          </div>
          <div class="description">{{ flag.subject }}</div>
        </div>
      {% endfor %}
    {% endfor %}
  </div>

  <div class="description">Set everything curbside by 7 AM.</div>
</div>

<div class="title_bar">
  <img src="data:image/svg+xml;base64,{{ svg_recycle_bin | base64_encode }}" width="24" height="24" alt="" />
  <span class="title">Durham Waste Collection</span>
  <span class="subtitle">{{ address | default: "Durham Region" }}</span>
  <span class="instance">Service {{ service_id }} · {{ next_date | date: "%a, %b %-d" }}</span>
</div>
```
                  <img src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bag.png" alt="Garbage" width="48" height="48">
                {% elsif flag.name == "yardwaste" %}
                  <img src="https://hossainkhan.com/archive/www/trmnl-plugin/yard-waste.png" alt="Yard Waste" width="48" height="48">
                {% elsif flag.name == "pumpkins" %}
                  <img src="https://hossainkhan.com/archive/www/trmnl-plugin/pumpkin.png" alt="Pumpkins" width="48" height="48">
                {% else %}
                  <img src="https://hossainkhan.com/archive/www/trmnl-plugin/garbage-bin.png" alt="{{ flag.subject }}" width="48" height="48">
                {% endif %}
              </div>
              <div class="description">{{ flag.subject }}</div>
            </div>
          {% endfor %}
        {% endfor %}
      </div>
    </div>

    <!-- Upcoming Schedule (Optional) -->
    <div class="column">
      <div class="label">Upcoming Schedule</div>
      {% assign future_dates = next_events | map: "day" | uniq | slice: 1, 3 %}
      {% for date in future_dates %}
        <div class="item py-1">
          <div class="description text-sm">{{ date | date: "%b %d" }}</div>
        </div>
      {% endfor %}
    </div>
  </div>

  <!-- Zone Information (Footer) -->
  {% assign zone_id = next_pickup_events.first.zone_id %}
  {% assign zone = zones[zone_id] %}
  <div class="mt-auto pt-4">
    <div class="divider"></div>
    <div class="description text-center text-xs">
      {{ zone.title }}
    </div>
  </div>
</div>
```

### Styling Considerations

**E-ink Optimization:**
- Use high contrast (black/white only)
- Avoid gradients or complex patterns
- SVG icons render cleanly with e-ink dithering
- Ensure text is minimum 12px for readability

**Framework Classes (v2):**
- `flex`, `flex--col`, `flex--row`: Flex layouts (preferred over nested `layout`)
- `flex--center-x`, `flex--center-y`: Alignment
- `flex--wrap`: Wrapping behavior
- `title--small`, `value`, `description`: Typography hierarchy
- `gap`, `gap-xs`, `gap-lg`, `gap-xxs`: Spacing between flex items
- `mt-*`, `mb-*`, `px-*`, `py-*`: Margin and padding utilities
- `bg-1`, `bg-2`, `bg-3`: Background shading

**Important Framework Rules:**
- ❌ Do NOT nest `layout` classes (use `flex` instead)
- ❌ Avoid inline styles like `min-height: 100%` (breaks title_bar)
- ✅ Use Framework spacing classes instead of inline `padding`, `margin`
- ✅ Embed SVGs using capture + base64_encode pattern
- ✅ Use `title--small` + `value` for countdown display hierarchy

---

## Error Handling

### Empty State (No Events)

```liquid
{% if next_events.size == 0 %}
  <div class="flex flex--col flex--center gap">
    <div class="title">No Upcoming Pickups</div>
    <div class="description">
      Check your Place ID or try again later
    </div>
  </div>
{% endif %}
```

### Invalid Place ID

```liquid
{% if events == nil or events.size == 0 %}
  <div class="flex flex--col flex--center gap bg-1 px py">
    <div class="title">⚠️ Configuration Error</div>
    <div class="description">
      Unable to fetch events. Please verify your Place ID.
    </div>
  </div>
{% endif %}
```

---

## Advanced Features

### 1. Multi-Collection Day Highlighting

When multiple collections occur on the same day, use visual hierarchy:

```liquid
{% assign collection_count = next_pickup_events.size %}
{% if collection_count > 1 %}
  <div class="description mb">
    {{ collection_count }} collections today
  </div>
{% endif %}
```

### 2. Color Coding (via Background Patterns)

```liquid
{% for flag in event.flags %}
  <div class="item {% if flag.name == 'recycling' %}bg-1{% elsif flag.name == 'garbage' %}bg-3{% endif %}">
    {{ flag.subject }}
  </div>
{% endfor %}
```

### 3. Reminder Threshold

Add visual urgency for imminent pickups:

```liquid
{% if days_until <= 1 %}
  <div class="flex flex--col gap px py bg-2">
    <div class="title">⚠️ Pickup {{ days_until == 0 ? "Today" : "Tomorrow" }}!</div>
  </div>
{% endif %}
```

---

## Testing Strategy

### 1. Preview Mode
Use TRMNL's "Edit Markup" live preview with sample data

### 2. Force Refresh
Click "Force Refresh" to test with live API data

### 3. Test Cases

| Scenario | Expected Result |
|----------|----------------|
| Valid Place ID | Display next pickup date and types with SVG icons |
| Multiple collections same day | Show all collection types in proper layout |
| No upcoming events | Show "No Upcoming Pickups" message |
| Invalid Place ID | Show configuration error message |
| API timeout | Show error state |
| Title bar rendering | Verify no min-height blocking display |

---

## Deployment Checklist

- [ ] Configure Polling URL with form field interpolation
- [ ] Add form fields (place_id, service_id, address, author_bio)
- [ ] Create Shared view with SVG icon captures
- [ ] Create markup for all view layouts (Full, Half Vertical, Half Horizontal, Quarter, Third)
- [ ] Test with multiple Place IDs
- [ ] Add error handling for edge cases
- [ ] Verify Framework v2 compliance (no nested layout, proper flex usage)
- [ ] Optimize for e-ink rendering
- [ ] Test title_bar displays correctly (no min-height: 100%)
- [ ] Test on actual TRMNL device
- [ ] Document user setup instructions
- [ ] (Optional) Publish as Recipe for community

---

## User Setup Instructions

### Finding Your Place ID

1. Visit https://recollect.net
2. Enter your Durham Region address
3. Inspect the browser's network requests (F12 > Network)
4. Look for API call to `/api/places/` endpoint
5. Copy the UUID from the URL (format: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`)

### Installing the Plugin

1. Navigate to TRMNL Plugins tab
2. Search for "Durham Waste Collection" (or your private plugin name)
3. Click "Add Plugin"
4. Enter your Place ID
5. (Optional) Enter your address for display
6. Save configuration
7. Add to a Playlist

---

## Maintenance & Updates

### API Changes
Monitor Recollect API for changes:
- Endpoint structure
- Response format
- Authentication requirements

### Data Refresh
TRMNL automatically polls based on device refresh schedule. To force update:
1. Go to Plugin Settings
2. Click "Force Refresh"

### Adding New Collection Types
Update icon mapping when new waste types are added:

```liquid
{% case flag.name %}
  {% when "recycling" %}♻️
  {% when "GreenBin" %}🗑️
  {% when "new_type" %}🆕
{% endcase %}
```

---

## Resources

- **TRMNL Private Plugins**: https://help.usetrmnl.com/en/articles/9510536-private-plugins
- **TRMNL Framework**: https://usetrmnl.com/framework
- **Liquid Documentation**: https://shopify.github.io/liquid/
- **Liquid 101 Guide**: https://help.usetrmnl.com/en/articles/10671186-liquid-101
- **TRMNL Custom Filters**: https://help.usetrmnl.com/en/articles/10347358-custom-plugin-filters
- **Recollect API**: Refer to sample JSON files in `/sample-json/`

---

## Version History

- **v1.0** - Initial specification (November 2025)
  - Polling strategy implementation
  - Support for multiple collection types
  - E-ink optimized display
  - Basic error handling

---

## Future Enhancements

1. **Multi-Address Support**: Allow users to track multiple properties
2. **Historical Data**: Show past pickup completion
3. **Weather Integration**: Alert if weather may affect collection
4. **Notification Preferences**: Customize reminder timing
5. **Collection Stats**: Track waste diversion metrics
