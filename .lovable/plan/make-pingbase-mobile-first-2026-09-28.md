# Make Pingbase mobile-first

## What will change

### Shared navigation
- Remove the search field at the top of the expanded desktop sidebar; keep the existing Search item in the lower Manage section.
- Keep the compact desktop sidebar, but replace it on phones with a slim page header and a fixed five-item bottom navigation inspired by Bookwan.
- Put Inbox, Contacts, Appointments, Services, and More in the mobile navigation; More opens the remaining destinations, including Automations, AI Agents, Search, Settings, and Profile.
- Respect phone safe areas and reserve enough page space so fixed navigation never covers content or controls.

### Mobile screen structure
- Convert multi-column workspaces into drill-in flows on phones rather than squeezing desktop panels side by side.
- Inbox will show the conversation list first, then open a conversation as a full-width screen with a clear back action; inbox filters and customer details will open as temporary panels.
- Settings and other secondary navigation will use a compact mobile section picker instead of disappearing with the desktop sidebar.
- Drawers and edit panels will become edge-to-edge mobile sheets with reachable headers, actions, and fields.

### Screen-by-screen responsiveness
- Adapt Appointments, Services, Contacts, Automations, AI Agents, Settings, Search, and Profile for narrow screens.
- Replace wide mobile tables with stacked, scannable rows while preserving desktop tables where useful.
- Make action groups wrap or collapse cleanly, stack multi-field forms, keep tabs horizontally usable, and remove every source of page-level horizontal scrolling.
- Preserve all current live data, editing, messaging, booking, handover, and integration behaviour.

## Technical details
- Build the responsive shell and reusable mobile navigation/panel patterns in the existing Veya design system.
- Keep desktop layouts intact above the mobile breakpoint and use the existing semantic colour and spacing tokens.
- Record the shared mobile navigation and drill-in convention in the project architecture notes.

## Verification
- Check every active app destination at 393×852 and desktop size.
- Exercise bottom navigation, More, inbox list-to-chat navigation, customer details, Settings sections, and mobile edit panels.
- Confirm no page-level horizontal overflow and a clean preview build.