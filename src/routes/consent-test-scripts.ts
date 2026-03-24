// Consent-gated script tags for the demo page.
// These use type="text/plain" so they're blocked until the matching service gets consent.
// Built as a string here because Svelte doesn't allow multiple <script> tags in a component.
export const consentGatedScripts = `<script type="text/plain" data-type="text/javascript" data-name="googleAnalytics">console.log('[googleAnalytics] Inline script executed after consent!')</script>
<script type="text/plain" data-type="text/javascript" data-name="facebookPixel" data-src="data:text/javascript,console.log('%5BfacebookPixel%5D%20External%20script%20loaded%20after%20consent!')"></script>
<script type="text/plain" data-type="text/javascript" data-name="essential">console.log('[essential] Required service script executed!')</script>`;
