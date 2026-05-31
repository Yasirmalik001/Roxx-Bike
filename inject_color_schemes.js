const fs = require('fs');
const path = require('path');

const sectionsDir = path.join(__dirname, 'sections');
const customSections = [
  'collections-tabs.liquid', 
  'custom-banner.liquid', 
  'custom-design.liquid', 
  'custom-hero-banner.liquid', 
  'discover-bikes.liquid', 
  'faq.liquid', 
  'feature-alternating.liquid', 
  'featured-collection.liquid', 
  'Featured-tabs.liquid', 
  'hero-slideshow.liquid', 
  'keep-discovering.liquid', 
  'masonary-gallery.liquid', 
  'partner-testimonials.liquid', 
  'quick-features-slider.liquid', 
  'story-section.liquid', 
  'tabbed-hero-slider.liquid', 
  'testimonials.liquid', 
  'trust-badges.liquid', 
  'who-is.liquid'
];

customSections.forEach(file => {
  const filePath = path.join(sectionsDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Add color_scheme to schema if missing
  if (!content.includes('"id": "color_scheme"')) {
    const settingsRegex = /"settings"\s*:\s*\[/;
    if (settingsRegex.test(content)) {
      content = content.replace(settingsRegex, `"settings": [
    {
      "type": "color_scheme",
      "id": "color_scheme",
      "label": "t:sections.all.colors.label",
      "default": "scheme-1"
    },`);
    }
  }

  // 2. Remove background_color from schema
  const bgColorSchemaRegex = /\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"background_color"[^}]*\},?/g;
  content = content.replace(bgColorSchemaRegex, '');
  // Also remove card_background just in case, wait no, let's just focus on background_color.

  // 3. Remove background-color: {{ section.settings.background_color }}; from CSS
  content = content.replace(/background-color\s*:\s*\{\{\s*section\.settings\.background_color\s*\}\}\s*;/g, '');
  
  // Also remove static background-color: #XXX if it's applying to the main section. Actually, safer to leave it if it's inside specific classes, but we should remove it from section-padding.
  
  // 4. Inject 'color-{{ section.settings.color_scheme }} gradient' into the main HTML div
  // The main div usually has class="... section-{{ section.id }}-padding ..."
  const mainDivRegex = /(<div[^>]*class="[^"]*section-\{\{\s*section\.id\s*\}\}-padding[^"]*)(")/;
  
  if (mainDivRegex.test(content)) {
    // Check if it already has color_scheme
    if (!content.match(/color-\{\{\s*section\.settings\.color_scheme\s*\}\}/)) {
      content = content.replace(mainDivRegex, `$1 color-{{ section.settings.color_scheme }} gradient"`);
    }
  } else {
    // Some files don't use section-padding. Let's find the first <div class="..."> after {%- endstyle -%}
    const endstyleIndex = content.indexOf('{%- endstyle -%}');
    if (endstyleIndex !== -1) {
      const remainingContent = content.substring(endstyleIndex);
      const firstDivMatch = remainingContent.match(/(<div[^>]*class=")([^"]*)(")/);
      if (firstDivMatch) {
        if (!firstDivMatch[0].includes('color-{{ section.settings.color_scheme }}')) {
          const newDiv = firstDivMatch[1] + firstDivMatch[2] + ` color-{{ section.settings.color_scheme }} gradient` + firstDivMatch[3];
          content = content.substring(0, endstyleIndex) + remainingContent.replace(firstDivMatch[0], newDiv);
        }
      }
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
