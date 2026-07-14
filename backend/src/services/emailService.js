// Stub provider — logs instead of sending. Swap the body of sendEmail for a real
// provider (SES, Postmark, etc.) once EMAIL_PROVIDER_API_KEY is wired up.
exports.sendEmail = async ({ to, subject, event }) => {
  console.log(`[email] to=${to} subject="${subject}" event=${event}`);
};
