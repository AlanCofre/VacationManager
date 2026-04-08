const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

function renderTemplate(templateName, data) {
  const filePath = path.join(__dirname, `../emails/${templateName}.html`);
  const file = fs.readFileSync(filePath, 'utf8');

  const template = handlebars.compile(file);
  return template(data);
}

module.exports = { renderTemplate };