const fs = require('fs');
const path = require('path');
const dir = './sections';
const files = fs.readdirSync(dir);
const missing = [];
files.forEach(f => {
  if(f.endsWith('.liquid')) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    if(!content.includes('"type": "color_scheme"')) {
      missing.push(f);
    }
  }
});
console.log("Missing color_scheme:", missing);
