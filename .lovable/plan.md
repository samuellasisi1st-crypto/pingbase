# Build the core Pingbase workspaces

## Outcome
Rebuild the three referenced screens as polished, functional Pingbase pages while preserving the existing live data, AI handover, booking, messaging, and contact logic.

## Changes
- **Shared workspace shell:** keep the compact collapsible primary navigation, add Automations back as a real destination, and strengthen the white-panel/soft-gray workspace hierarchy shown in the references.
- **Inbox:** create a four-part operational layout: compact inbox views, conversation list, full-width chat, and an optional customer inspector. Keep live updates, filters, search, human takeover, Return to AI, sending, appointments, and customer details working. Keep the inspector closed by default and prevent horizontal scrolling.
- **Contacts:** build the dense contact workspace from the reference with compact views, search/filter/view controls, a responsive data table, channel indicators, labels, pagination controls, and the existing contact detail drawer. Use only real stored contacts; no dummy rows.
- **Automations:** replace the summary page with a usable visual flow workspace inspired by the reference. Show the existing booking-triggered automations as connected steps on a pan/zoom-style canvas, with a compact toolbar and activity-log view. Do not invent automation execution behavior that the backend does not support.
- **Visual system:** use only Veya components and tokens, regular-weight navigation labels, compact sizing, white content panels on a soft-gray canvas, restrained borders, and consistent control density.

## Validation
- Verify `/`, `/contacts`, and `/automations` with live preview data at desktop and narrow widths.
- Confirm the inbox has no horizontal page scroll and all collapse/detail controls work.
- Confirm existing send, takeover, Return to AI, search, filtering, and contact selection actions remain usable.
- Check the preview build and route metadata.
