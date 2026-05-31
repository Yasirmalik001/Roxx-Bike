const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'sections', 'faq.liquid');
let content = fs.readFileSync(filePath, 'utf8');

// Fix heading class
content = content.replace(/<h2 class="faqrs-heading">\{\{\s*section\.settings\.heading[^}]*\}\}<\/h2>/g, 
  `<h2 class="hero-features__heading {{ section.settings.heading_size }}">{{ section.settings.heading | newline_to_br }}</h2>`);

// Fix heading sizes schema
const newOptions = `[
            { "value": "h2", "label": "Small" },
            { "value": "h1", "label": "Medium" },
            { "value": "h0", "label": "Large" },
            { "value": "hxl", "label": "Extra Large" },
            { "value": "hxxl", "label": "Extra Extra Large" }
          ]`;

const headingRegex = /(\{\s*"type"\s*:\s*"textarea"\s*,\s*"id"\s*:\s*"heading"[^}]*\})/;
if (!content.includes('"id": "heading_size"')) {
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

// Add color_scheme if missing
if (!content.includes('"id": "color_scheme"')) {
  const settingsRegex = /"settings"\s*:\s*\[/;
  content = content.replace(settingsRegex, `"settings": [
    {
      "type": "color_scheme",
      "id": "color_scheme",
      "label": "t:sections.all.colors.label",
      "default": "scheme-1"
    },`);
}

// Inject 'color-{{ section.settings.color_scheme }} gradient' into the main HTML div
const mainDivRegex = /(<div[^>]*class="[^"]*section-\{\{\s*section\.id\s*\}\}-padding[^"]*)(")/;
if (mainDivRegex.test(content) && !content.includes('color-{{ section.settings.color_scheme }}')) {
  content = content.replace(mainDivRegex, `$1 color-{{ section.settings.color_scheme }} gradient"`);
}

// Remove background_color from schema
const bgColorSchemaRegex = /\{\s*"type"\s*:\s*"color"\s*,\s*"id"\s*:\s*"background_color"[^}]*\},?/g;
content = content.replace(bgColorSchemaRegex, '');

// Remove background-color from CSS
content = content.replace(/background-color\s*:\s*\{\{\s*section\.settings\.background_color\s*\}\}\s*;/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated faq.liquid");
