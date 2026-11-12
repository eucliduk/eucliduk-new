# Homepage newsletter signup

The homepage signup banner opens a native dialog. It replaces the former
“Mapping the Universe” embedded map.

Signup is deliberately unavailable until Euclid's own mailing service is
configured. The unconfigured form is disabled, explains its status, and neither
sends nor saves visitor details. It does not use the Webb UK mailing list.

To connect the form, set both HTTPS URLs in `euclid-newsletter-config.js`:

- `signupAction`: the mailing provider's HTML form POST endpoint.
- `privacyUrl`: the privacy notice covering this newsletter.

The form posts `EMAIL`, optional `FNAME` and `LNAME`, `INTERESTED`, and required
`AGREE_TO_TERMS`. Check the provider's expected field names, list identifiers,
anti-spam requirements and subscription confirmation workflow before activation.
If it requires different fields or a hosted signup page, adapt the integration
instead of using an unrelated endpoint. Do not store private API keys here.

The provider handles submission in a new tab. The website does not show a success
message or claim a subscription was completed without confirmation from it.
