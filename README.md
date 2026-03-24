# svelte-klaro

A Svelte 5 port of the [Klaro](https://github.com/kiprotect/klaro) cookie consent manager. Fully typed, reactive, and tree-shakeable.

## Features

- 1:1 UI/UX match with the original Klaro consent manager
- Svelte 5 runes for reactive consent state (`$state`, `$derived`)
- Purpose-grouped or flat service list with toggle switches
- Consent notice banner + full consent modal
- Contextual consent notices for blocked iframes/scripts
- 25 bundled translations (tree-shakeable, only English included by default)
- CSS custom property theming with composable position/color themes
- Cookie/localStorage/sessionStorage consent persistence
- Automatic cookie deletion on consent withdrawal
- Imperative API (`showKlaro()`, `hideKlaro()`, `window.klaro`)
- Svelte 5 event callback props (`onconsentchange`, `onsave`, etc.)
- SSR-safe (renders client-side, no server errors)

## Install

```bash
pnpm add svelte-klaro
```

## Quick Start

```svelte
<script>
    import { Klaro } from 'svelte-klaro';
    import 'svelte-klaro/styles';

    const config = {
        acceptAll: true,
        services: [
            {
                name: 'google-analytics',
                title: 'Google Analytics',
                purposes: ['analytics'],
                cookies: [/^_ga/, '_gid']
            },
            {
                name: 'hotjar',
                title: 'Hotjar',
                purposes: ['analytics']
            }
        ]
    };
</script>

<Klaro {config} />
```

## Configuration

The `config` prop accepts a `KlaroConfigInterface` object. Key options:

| Option                   | Type                                             | Default      | Description                                  |
| ------------------------ | ------------------------------------------------ | ------------ | -------------------------------------------- |
| `services`               | `KlaroServiceInterface[]`                        | **required** | Third-party services to manage               |
| `acceptAll`              | `boolean`                                        | `false`      | Show "Accept all" button                     |
| `mustConsent`            | `boolean`                                        | `false`      | Block page until user consents               |
| `hideDeclineAll`         | `boolean`                                        | `false`      | Hide the decline button                      |
| `groupByPurpose`         | `boolean`                                        | `true`       | Group services by purpose in modal           |
| `storageMethod`          | `'cookie' \| 'localStorage' \| 'sessionStorage'` | `'cookie'`   | How to persist consent                       |
| `storageName`            | `string`                                         | `'klaro'`    | Cookie/storage key name                      |
| `cookieExpiresAfterDays` | `number`                                         | `120`        | Cookie expiry                                |
| `htmlTexts`              | `boolean`                                        | `false`      | Allow HTML in translation strings            |
| `noticeAsModal`          | `boolean`                                        | `false`      | Show notice as modal overlay                 |
| `embedded`               | `boolean`                                        | `false`      | Render inline instead of fixed               |
| `privacyPolicy`          | `string \| Record<string, string>`               | —            | Privacy policy URL (or per-language)         |
| `styling`                | `object`                                         | —            | Theme and CSS variable overrides             |
| `translations`           | `object`                                         | —            | Translation overrides (merged with defaults) |
| `purposeOrder`           | `string[]`                                       | —            | Sort order for purposes                      |

### Service Configuration

Each service in the `services` array:

```typescript
{
  name: 'google-analytics',       // unique identifier
  title: 'Google Analytics',       // display name
  purposes: ['analytics'],         // groups in modal
  description: 'Web analytics',    // shown in modal
  cookies: [/^_ga/, '_gid'],       // deleted on consent withdrawal
  required: false,                 // cannot be disabled
  optOut: false,                   // enabled by default, user can opt out
  onlyOnce: false,                 // execute handler only once
  onAccept: (opts) => {},          // called when consent granted
  onDecline: (opts) => {},         // called when consent withdrawn
  callback: (consent, service) => {} // called on any change
}
```

## Translations

English translations are bundled by default. Import additional languages from `svelte-klaro/translations`:

```svelte
<script>
    import { Klaro } from 'svelte-klaro';
    import { de, fr } from 'svelte-klaro/translations';

    const config = {
        translations: { de, fr },
        lang: 'de',
        services: [
            /* ... */
        ]
    };
</script>

<Klaro {config} />
```

Available languages: `ca`, `cs`, `da`, `de`, `el`, `en`, `es`, `fi`, `fr`, `gl`, `hr`, `hu`, `it`, `nl`, `no`, `oc`, `pl`, `pt`, `ro`, `ru`, `sr`, `sr_cyrl`, `sv`, `tr`, `zh`

Override individual keys by merging into `config.translations`:

```js
const config = {
    translations: {
        en: {
            consentNotice: { description: 'We use cookies for {purposes}.' },
            purposes: { analytics: 'Analytics & Metrics' }
        }
    }
    // ...
};
```

## Styling

### Import styles

```js
import 'svelte-klaro/styles';
```

### Themes

Compose themes via `config.styling.theme`:

```js
const config = {
    styling: { theme: ['top', 'wide', 'light'] }
    // ...
};
```

| Theme    | Effect                               |
| -------- | ------------------------------------ |
| `top`    | Notice at top                        |
| `bottom` | Notice at bottom (default)           |
| `left`   | Notice on the left                   |
| `right`  | Notice on the right (default)        |
| `wide`   | Notice spans full viewport width     |
| `light`  | Light color scheme (default is dark) |

### CSS Custom Properties

Override via `config.styling` or plain CSS:

```js
const config = {
    styling: {
        theme: ['bottom'],
        green1: '#0a6e5c',
        'border-radius': '8px',
        'font-size': '13px'
    }
    // ...
};
```

```css
.klaro {
    --green1: #0a6e5c;
    --dark1: #333;
    --light1: #fafafa;
    --font-size: 14px;
    --border-radius: 4px;
    --notice-max-width: 400px;
}
```

## Events

Svelte 5 callback props on the `<Klaro>` component:

| Prop              | Signature                            | When                              |
| ----------------- | ------------------------------------ | --------------------------------- |
| `onconsentchange` | `(consents, service, value) => void` | Any individual consent toggles    |
| `onsave`          | `(manager, eventType) => void`       | User saves (accept/decline/save)  |
| `onapply`         | `(manager, changedCount) => void`    | Consents applied to DOM           |
| `onshow`          | `() => void`                         | Notice/modal becomes visible      |
| `onhide`          | `() => void`                         | Notice/modal is hidden            |
| `oninit`          | `(manager) => void`                  | Manager initialized (client-side) |

```svelte
<Klaro
    {config}
    onconsentchange={(consents, service, value) => {
        console.log(`${service}: ${value}`);
    }}
    onsave={(manager, eventType) => {
        // eventType: 'accept' | 'decline' | 'save'
        analytics.track('consent_' + eventType);
    }}
/>
```

## Programmatic API

```svelte
<script>
    import { Klaro, showKlaro, hideKlaro, getManager } from 'svelte-klaro';
</script>

<button onclick={() => showKlaro()}>Cookie Settings</button>

<Klaro {config} />
```

Also available globally:

```js
window.klaro.show();
window.klaro.hide();
window.klaro.getManager();
```

## SSR

svelte-klaro is SSR-safe. During server-side rendering it outputs nothing (the consent manager requires browser APIs). The consent notice appears on client hydration. No `document is not defined` errors.

## Types

All types are exported:

```typescript
import type { KlaroConfigInterface, KlaroServiceInterface, ConsentManager } from 'svelte-klaro';
```

## License

Based on [Klaro](https://github.com/kiprotect/klaro) by KIProtect.
