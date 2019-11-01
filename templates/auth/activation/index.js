// Vendor libs
const hb = require('handlebars');
const fs = require('fs');
const path = require('path');

module.exports.getHtml = (lang, name, activationId) => {
  // Load template
  const templatePath = path.join(__dirname, `activation-${lang}.hbs`);
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Compile template
  const compiled = hb.compile(template);
  const html = compiled({ name, activationId });

  return html;
};
