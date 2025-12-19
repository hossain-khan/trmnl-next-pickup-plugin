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

1. **Filter Next Event**: Find the earliest event date >= current date, excluding holidays
2. **Filter Pickup Flags**: Only display flags with `event_type == "pickup"`
3. **Group by Date**: Combine all flags/collections for the same date
4. **Extract Collection Types**: Parse all `flags[]` for that date
5. **Format Display**: Show date + collection types with icons

### Liquid Template Structure

```liquid
{% comment %}
  Process events to find next pickup date and combine collection types
  Excludes holiday events (Christmas, New Years, etc.)
{% endcomment %}

{% assign today = "now" | date: "%Y-%m-%d" %}
{%- comment -%} Filter out holiday events, only show actual pickup days {%- endcomment -%}
{% assign next_events = events | where_exp: "event", "event.day >= today and event.is_holiday != 1" | sort: "day" %}
{% assign next_date = next_events.first.day %}

{% comment %}
  Group all events for the next date
{% endcomment %}

{% assign next_pickup_events = next_events | where: "day", next_date %}

{% comment %}
  Filter to only pickup flags (skip holiday markers)
{% endcomment %}

{% assign pickup_flags = event.flags | where: "event_type", "pickup" %}

{% comment %}
  Calculate days until pickup
{% endcomment %}

{% assign next_date_timestamp = next_date | date: "%s" %}
{% assign today_timestamp = today | date: "%s" %}
{% assign days_until = next_date_timestamp | minus: today_timestamp | divided_by: 86400 %}
```

### View Implementations

All view implementations (Full, Half Vertical, Half Horizontal, Quarter, Third) are documented with complete markup in:

**📄 [PLUGIN_SETUP_GUIDE.md](PLUGIN_SETUP_GUIDE.md)**

Each view includes:
- Complete Liquid markup
- Container structure using `layout layout--col` for title_bar support
- Typography hierarchy (`title--small` + `value` for emphasis)
- SVG icons via base64_encode pattern
- Compact title_bar with service information
- Framework v2 compliant classes

**View Summary:**

| View | Size | Container | Time Display | Icons | Optimization |
|------|------|-----------|--------------|-------|--------------|
| Full | 800×480 | `layout layout--col` | `title--small` + `value` | 136×136 | Centered layout with full details |
| Half Vertical | 400×480 | `layout layout--col` | `title--small` + `value` | 96×96 | 2-column icon grid |
| Half Horizontal | 800×240 | `layout layout--col` | Single-line `title` | 80×80 | Compact single-line header for limited height |
| Quarter | 400×240 | `layout layout--col` | `title--small` + `value value--small` | 72×72 | Ultra-compact with abbreviated labels |
| Third | ~267×480 | `flex flex--col` | `title--small` + `value` | 56×56 | Vertical column layout |

**Shared View - SVG Icon Library:**

> **Note:** The complete icon library implementation with base64 data (~40KB) is in [SHARED_VIEW_ICONS.md](SHARED_VIEW_ICONS.md)

**Icon Files Available** (in `resources/icons/`):
- `recycle-bin.png` → Blue Box Recycling (1024×1024)
- `green-recycle-bin.png` → Green Bin Organics (512×512)
- `garbage-bag.png` → Garbage Collection (512×512)
- `yard-waste.png` → Yard Waste (380×340)
- `pumpkin.png` → Seasonal Pumpkins

Each icon has a corresponding `-base64.txt` file with the complete data URI.

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

**Framework v2 Implementation Guidelines:**
- ✅ Use `layout layout--col` as main container to enable title_bar positioning
- ✅ Use `flex` classes for content layout within the container
- ✅ Embed SVGs using capture + base64_encode pattern (no external URLs)
- ✅ Use `title--small` + `value` for typography hierarchy
- ✅ Use Framework spacing classes (`gap`, `px-*`, `py-*`, `mt-*`, etc.)
- ❌ Do NOT nest `layout` classes
- ❌ Avoid inline styles that can break responsive behavior

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
| Holiday before pickup | Skip holiday event (e.g., Christmas), show next actual pickup day |
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

Complete step-by-step setup instructions are available in:

**📄 [PLUGIN_SETUP_GUIDE.md](PLUGIN_SETUP_GUIDE.md)**

The guide covers:
- Finding your Place ID (Configuration Helper Tool, Manual Method, Sample Data)
- Creating the plugin on TRMNL (Settings, Form Fields, Polling Configuration)
- Adding markup for all view sizes
- Testing with Force Refresh
- Troubleshooting common issues
- Adding plugin to device and p Enter your address for display
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
