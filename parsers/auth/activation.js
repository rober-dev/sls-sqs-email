// Custom libs
const templates = require('../../templates');

module.exports.parse = body => {
  // Get specific params fro AUTH_ACTIVATION email
  const { lang, activationId } = body;
  const name = body.name ? body.name : body.toName;

  // Check email arguments
  if (!name) {
    throw new Error(
      `Parameter 'name' is required for AUTH_ACTIVATION email sending`
    );
  }

  if (!activationId) {
    throw new Error(
      `Parameter 'activationId' is required for AUTH_ACTIVATION email sending`
    );
  }

  // Build message body
  const html = templates.auth.activation.getHtml(lang, name, activationId);

  return html;
};
