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

```html
<div class="layout">
  <!-- Title Bar -->
  <div class="title-bar">
    <div class="title-bar__title">Waste Collection</div>
    <div class="title-bar__subtitle">{{ address | default: "Durham Region" }}</div>
  </div>

  <!-- Next Pickup Section -->
  <div class="columns gap-4">
    <div class="column">
      <!-- Date Display -->
      <div class="item">
        <div class="label">Next Pickup</div>
        <div class="title size-xl">
          {{ next_date | date: "%A, %B %d" }}
        </div>
        <div class="description">
          {% if days_until == 0 %}
            Today
          {% elsif days_until == 1 %}
            Tomorrow
          {% else %}
            In {{ days_until }} days
          {% endif %}
        </div>
      </div>

      <!-- Collection Types -->
      <div class="mt-4">
        <div class="label">What's Being Collected</div>
        {% for event in next_pickup_events %}
          {% for flag in event.flags %}
            <div class="item flex items-center gap-2 py-2">
              <!-- Icon representation using PNG images -->
              <div style="min-width: 48px; max-width: 48px;">
                {% if flag.name == "recycling" %}
                  <img src="https://hossainkhan.com/archive/www/trmnl-plugin/recycle-bin.png" alt="Blue Box" width="48" height="48">
                {% elsif flag.name == "GreenBin" %}
                  <img src="https://hossainkhan.com/archive/www/trmnl-plugin/green-recycle-bin.png" alt="Green Bin" width="48" height="48">
                {% elsif flag.name == "garbage" %}
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
- Use TRMNL's built-in dithered backgrounds if needed
- Ensure text is minimum 12px for readability

**Framework Classes:**
- `layout`: Main container
- `title-bar`: Standardized header
- `columns`: Multi-column layout
- `item`: Content blocks
- `label`, `title`, `value`, `description`: Typography
- `gap-*`, `mt-*`, `py-*`: Spacing utilities

---

## Error Handling

### Empty State (No Events)

```liquid
{% if next_events.size == 0 %}
  <div class="layout flex items-center justify-center">
    <div class="text-center">
      <div class="title">No Upcoming Pickups</div>
      <div class="description mt-2">
        Check your Place ID or try again later
      </div>
    </div>
  </div>
{% endif %}
```

### Invalid Place ID

```liquid
{% if events == nil or events.size == 0 %}
  <div class="layout">
    <div class="item bg-1">
      <div class="title">⚠️ Configuration Error</div>
      <div class="description mt-2">
        Unable to fetch events. Please verify your Place ID.
      </div>
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
  <div class="description text-sm mb-2">
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
  <div class="border border-2 p-2">
    <div class="title">⚠️ Pickup {{ days_until == 0 ? "Today" : "Tomorrow" }}!</div>
  </div>
{% endif %}
```

---

## Testing Strategy

### 1. Preview Mode
Use TRMNL's "Edit Markup" live preview with sample data from `events.json`

### 2. Force Refresh
Click "Force Refresh" to test with live API data

### 3. Test Cases

| Scenario | Expected Result |
|----------|----------------|
| Valid Place ID | Display next pickup date and types |
| Multiple collections same day | Show all collection types |
| No upcoming events | Show "No Upcoming Pickups" |
| Invalid Place ID | Show configuration error |
| API timeout | Show error state |

---

## Deployment Checklist

- [ ] Configure Polling URL with form field interpolation
- [ ] Add form fields for Place ID and address
- [ ] Create markup for all view layouts (Full, Half, Quarter)
- [ ] Test with multiple Place IDs
- [ ] Add error handling for edge cases
- [ ] Optimize for e-ink rendering
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
