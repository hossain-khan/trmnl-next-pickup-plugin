# Shared View - SVG Icon Library

This file contains the complete Liquid capture blocks for all waste collection icons used in the TRMNL Durham Waste Plugin.

## Usage

Copy this entire code block into the **"Shared"** tab in the TRMNL markup editor. These capture blocks will be available to all view sizes (Full, Half, Quarter, Third).

## Implementation Instructions

1. **Copy the code below** into the TRMNL "Shared" tab
2. **Replace the placeholder base64 data** with actual content from `resources/icons/*-base64.txt` files:
   - Line with `svg_recycle_bin`: Use `resources/icons/recycle-bin-base64.txt`
   - Line with `svg_green_recycle_bin`: Use `resources/icons/green-recycle-bin-base64.txt`
   - Line with `svg_garbage_bag`: Use `resources/icons/garbage-bag-base64.txt`
   - Line with `svg_yard_waste`: Use `resources/icons/yard-waste-base64.txt`
   - Line with `svg_pumpkin`: Use `resources/icons/pumpkin-base64.txt`
3. **Save** the Shared tab

## Icon Files Reference

All base64-encoded icon data files are located in `resources/icons/`:

| Icon File | Size | Collection Type | Base64 File |
|-----------|------|-----------------|-------------|
| recycle-bin.png | ~27KB | Blue Box Recycling | recycle-bin-base64.txt |
| green-recycle-bin.png | ~13KB | Green Bin Organics | green-recycle-bin-base64.txt |
| garbage-bag.png | ~14KB | Garbage Collection | garbage-bag-base64.txt |
| yard-waste.png | ~17KB | Yard Waste | yard-waste-base64.txt |
| pumpkin.png | ~26KB | Seasonal Pumpkins | pumpkin-base64.txt |

## Liquid Code for Shared Tab

```liquid
{% comment %}
  Shared View - Inline SVG Icons
  Captures for all collection type icons (embedded, no external dependencies)
  
  Each capture block contains the complete SVG markup with embedded image data.
  The SVG files are located in resources/icons/ and can be copied directly.
{% endcomment %}

{%- capture svg_recycle_bin -%}
<svg height="1024" viewBox="0 0 1024 1024" width="1024" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image height="1024" preserveAspectRatio="none" width="1024" xlink:href="PASTE_CONTENT_FROM_recycle-bin-base64.txt_HERE"/>
</svg>
{%- endcapture -%}

{%- capture svg_green_recycle_bin -%}
<!-- This is the Green Bin organics icon (512x512 viewBox) -->
<svg height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image height="512" preserveAspectRatio="none" width="512" xlink:href="PASTE_CONTENT_FROM_green-recycle-bin-base64.txt_HERE"/>
</svg>
{%- endcapture -%}

{%- capture svg_garbage_bag -%}
<!-- This is the Garbage collection icon (512x512 viewBox) -->
<svg height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image height="512" preserveAspectRatio="none" width="512" xlink:href="PASTE_CONTENT_FROM_garbage-bag-base64.txt_HERE"/>
</svg>
{%- endcapture -%}

{%- capture svg_yard_waste -%}
<!-- This is the Yard waste icon (380x340 viewBox) -->
<svg height="340" viewBox="0 0 380 340" width="380" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image height="340" preserveAspectRatio="none" width="380" xlink:href="PASTE_CONTENT_FROM_yard-waste-base64.txt_HERE"/>
</svg>
{%- endcapture -%}

{%- capture svg_pumpkin -%}
<!-- This is the Seasonal pumpkins pickup icon (1024x1024 viewBox) -->
<svg height="1024" viewBox="0 0 1024 1024" width="1024" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image height="1024" preserveAspectRatio="none" width="1024" xlink:href="PASTE_CONTENT_FROM_pumpkin-base64.txt_HERE"/>
</svg>
{%- endcapture -%}
```

## How to Use Icons in Views

Once the icons are captured in the Shared tab, reference them in any view (Full, Half, Quarter, Third) using:

```liquid
<img 
  src="data:image/svg+xml;base64,{{ svg_recycle_bin | base64_encode }}" 
  alt="Blue Box" 
  width="136" 
  height="136" 
/>
```

### Icon Size Recommendations by View

- **Full View**: 136px × 136px
- **Half Views**: 80px × 80px
- **Quarter View**: 72px × 72px
- **Third View**: 56px × 56px

## Converting PNG to Base64 (Optional)

If you need to regenerate the base64 files, macOS includes the built-in `base64` command:

```bash
# Generate base64 data URI for a single icon
echo "data:image/png;base64,$(base64 < resources/icons/recycle-bin.png)"

# Process all PNG icons and save to text files
cd resources/icons
for file in *.png; do
  echo "Processing $file..."
  echo "data:image/png;base64,$(base64 < "$file")" > "${file%.png}-base64.txt"
done
```

## Technical Notes

- **Format**: Each icon is a PNG image embedded as base64 within an SVG wrapper
- **Encoding**: The base64 strings include the `data:image/png;base64,` prefix
- **Optimization**: PNG files have been optimized to reduce size while maintaining quality
- **Framework**: Uses TRMNL Framework v2 Liquid templating with base64_encode filter
- **No External Dependencies**: All icons are embedded directly in the markup (no CDN/external URLs)

## Troubleshooting

**Issue**: Icons not displaying
- **Solution**: Verify the base64 data includes the full `data:image/png;base64,` prefix
- **Solution**: Check that the Shared tab was saved before testing other views

**Issue**: Broken/corrupted images
- **Solution**: Ensure no line breaks or whitespace were added when copying base64 data
- **Solution**: Re-copy from the original `-base64.txt` files

**Issue**: "Invalid Liquid syntax" error
- **Solution**: Verify all `{% capture %}` and `{% endcapture %}` tags are properly closed
- **Solution**: Check for any accidental character additions in the xlink:href attributes
