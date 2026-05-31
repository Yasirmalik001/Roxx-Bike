const fs = require('fs');
const path = require('path');

const sectionsDir = path.join(__dirname, 'sections');
const customSections = [
  'bento-categories.liquid',
  'image-split-partner.liquid',
  'image-with-test.liquid',
  'product-comparison.liquid',
  'shop-the-look.liquid',
  'showroom-map.liquid',
  'swiper-template.liquid'
];

customSections.forEach(file => {
  const filePath = path.join(sectionsDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add color_scheme to schema if missing
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

  // Remove background_color from schema
  const bgColorSchemaRegex = /\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"background_color"[^}]*\},?/g;
  content = content.replace(bgColorSchemaRegex, '');
  
  // Remove background-color from CSS
  content = content.replace(/background-color\s*:\s*\{\{\s*section\.settings\.background_color\s*\}\}\s*;/g, '');
  
  // Inject 'color-{{ section.settings.color_scheme }} gradient' into the main HTML div
  const mainDivRegex = /(<div[^>]*class="[^"]*section-\{\{\s*section\.id\s*\}\}-padding[^"]*)(")/;
  
  if (mainDivRegex.test(content)) {
    if (!content.match(/color-\{\{\s*section\.settings\.color_scheme\s*\}\}/)) {
      content = content.replace(mainDivRegex, `$1 color-{{ section.settings.color_scheme }} gradient"`);
    }
  } else {
    const endstyleIndex = content.indexOf('{%- endstyle -%}');
    if (endstyleIndex !== -1) {
      const remainingContent = content.substring(endstyleIndex);
      const firstDivMatch = remainingContent.match(/(<div[^>]*class=")([^"]*)(")/);
      if (firstDivMatch && !firstDivMatch[0].includes('color-{{ section.settings.color_scheme }}')) {
        const newDiv = firstDivMatch[1] + firstDivMatch[2] + ` color-{{ section.settings.color_scheme }} gradient` + firstDivMatch[3];
        content = content.substring(0, endstyleIndex) + remainingContent.replace(firstDivMatch[0], newDiv);
      }
    }
  }

  // --- NOW UPDATE HEADINGS ---
  const newOptions = `[
            { "value": "h2", "label": "Small" },
            { "value": "h1", "label": "Medium" },
            { "value": "h0", "label": "Large" },
            { "value": "hxl", "label": "Extra Large" },
            { "value": "hxxl", "label": "Extra Extra Large" }
          ]`;

  const threeOptionsRegex = /\[\s*\{\s*"value"\s*:\s*"h2"[^}]*\}\s*,\s*\{\s*"value"\s*:\s*"h1"[^}]*\}\s*,\s*\{\s*"value"\s*:\s*"h0"[^}]*\}\s*\]/g;
  if (threeOptionsRegex.test(content)) {
    content = content.replace(threeOptionsRegex, newOptions);
  }

  // If heading_size is missing entirely, try adding it after the "heading" text setting
  if (!content.includes('"id": "heading_size"')) {
    const headingRegex = /(\{\s*"type"\s*:\s*"(?:text|textarea|inline_richtext)"\s*,\s*"id"\s*:\s*"(?:heading|title)"[^}]*\})/;
    if (headingRegex.test(content)) {
      const headingSizeSchema = `,
    {
      "type": "select",
      "id": "heading_size",
      "options": ${newOptions},
      "default": "h1",
      "label": "Heading Size"
    }`;
      content = content.replace(headingRegex, `$1${headingSizeSchema}`);
    }
  }

  // Find standard headings like <h2 class="whatever">{{ section.settings.heading }}</h2> 
  // We can't safely regex every heading in HTML without looking at them, so we will skip HTML injection for headings to avoid breaking things, 
  // but if we find simple ones we replace them.
  content = content.replace(/<h2 class="[^"]*">\{\{\s*section\.settings\.heading[^}]*\}\}<\/h2>/g, 
    `<h2 class="hero-features__heading {{ section.settings.heading_size }}">{{ section.settings.heading | escape }}</h2>`);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
