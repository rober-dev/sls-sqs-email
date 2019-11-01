// Vendor libs
const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');

// Custom libs
const emailParsers = require('./parsers');

// Get environment variables
dotenv.config();

// Setup SendGrid account
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function getEmail(email) {
  if (!email) {
    throw new Error(`Param "from" is required for email sending`);
  } else if (!validateEmail(email)) {
    throw new Error(`Param "from" with value ${email} is not a valid email`);
  }
  return email;
}

function buildEmailMessageBase(body) {
  let fromEmail = getEmail(body.from);
  if (body.fromName) {
    from = {
      email: fromEmail,
      name: body.fromName
    };
  } else {
    from = fromEmail;
  }

  let toEmail = getEmail(body.to);
  if (body.toName) {
    to = {
      email: toEmail,
      name: body.toName
    };
  } else {
    to = toEmail;
  }

  const subject = body.subject;

  if (!subject) {
    throw new Error(`Param "subject" is required for email sending`);
  }

  // Build initial message
  const msg = {
    from,
    to,
    subject
  };

  return msg;
}

// Lambda definition
module.exports.sendEmail = async event => {
  if (event && event.Records) {
    event.Records.map(record => {
      const messageId = record.messageId;
      const body = record.body;

      try {
        if (!body) {
          throw new Error('There is not param "body" on message attribute');
        }

        // Members
        const { type, lang } = body;

        // Validate params
        if (!type) {
          throw new Error('There is not param "type" on message attribute');
        }

        if (!lang) {
          throw new Error('There is not param "lang" on message attribute');
        }

        // Build message with common params (from, to, subject, ...)
        let msg = buildEmailMessageBase(body);

        // Get message body by template type
        switch (type) {
          case 'AUTH_ACTIVATION':
            msg.html = emailParsers.authActivation.parse(body);
            break;
          default:
            throw new Error(`Param type (${type}) not valid`);
        }

        // Try send email
        try {
          sgMail
            .send(msg)
            .then(result => {
              let message = `SQS messageId ${messageId}: Email with subject "${msg.subject}" sent to ${msg.to} with success`;
              if (msg.toName) {
                message += `(${msg.toName})`;
              }

              console.log(message);
              return {
                statusCode: 200,
                message
              };
            })
            .catch(err => {
              let message = `SQS messageId ${messageId}: ERROR sending email with subject "${msg.subject}" sent to ${msg.to}`;
              if (msg.toName) {
                message += `(${msg.toName})`;
              }

              console.error(message, err);
              return {
                statusCode: 500,
                message
              };
            });
        } catch (error) {
          throw new Error(`SQS ${messageId}: ERROR`, error);
        }
      } catch (err) {
        throw new Error('Error handle Lambda method "sendEmail"', err);
      }
    });
  } else {
    return {
      statusCode: 200,
      body: 'There are not any messages to process in queue'
    };
  }
};
