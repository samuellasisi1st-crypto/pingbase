# Appointments calendar, multi-agent AI, editable automations, dark mode, working composer

## Your question about AI agents
Right now each business gets exactly **one** AI agent (Nia at Studio Nine Hair). Each business sets its own name, tone, instructions and guardrails, and those settings only affect that business's customers. This plan adds **multiple agents per business**. Each agent has its own identity, instructions, guardrails and assigned channels (for example "Bookings on WhatsApp" and "Instagram enquiries"). Each conversation is routed to exactly one agent.

## 1. Appointments calendar (following Bookwan's calendar)
- Look at Bookwan's calendar screens and copy how they're structured: Day, Week and Month views, a time grid with staff columns in Day view, a mini month picker, and a "Today" button with arrows.
- Show your connected Google Calendar busy times as grey striped "Busy (Google)" blocks. Show days outside opening hours or covered by staff time off as blocked too.
- Fix the controls from the screenshot: put search, the month label and the arrows on one tidy toolbar row.
- On phones, use a Day/agenda view with a horizontal date strip.

## 2. AI Agents
- The AI Agents page shows a grid of all your agents: name, status, channels, and today's actions. It also has a "New agent" button.
- Tap an agent to open the current detail page (Identity, Instructions, Guardrails, Channels, Always on), with a back link.
- Incoming messages go to the agent assigned to that channel. If no agent is assigned, they go to the default agent.

## 3. Automations: a real flow editor
- Add a drag-and-drop board using React Flow. You can add steps (trigger, wait, send message, condition, update booking), connect them, move them, delete them and edit each step in a side panel.
- Flows are saved per business. The existing reminder and follow-up flows get loaded in as starting flows.
- Saved flows actually run: the scheduler reads them when it queues reminders, so what you see on the board is what runs.

## 4. Light and dark mode
- Add dark versions of all the design system's colours, a toggle in the profile and settings menu, and remember your choice.

## 5. Chat composer buttons
- **Attachment:** upload an image or file, which sends it on WhatsApp, Instagram and Messenger.
- **Emoji:** an emoji picker.
- **Calendar:** pick a service and a free slot (using real availability), then send those time options to the customer.
- **AI:** Nia drafts a reply into the message box for you to edit before sending.

## Technical notes
- New tables: `ai_agents` (one per agent, per business, with assigned channels) and `automation_flows` (the flow's steps and connections). Existing `ai_agent_settings` data moves into the first agent. A file storage bucket for attachments, with access limited to members of each business.
- The Google busy times come from the existing free/busy read for the date range you're viewing. If the calendar can't be read, you see an error message instead of a calendar that looks free.
- Dark mode sets a `.dark` class on the page and adds dark colour values to the design system's colours only.
- New packages: `@xyflow/react` and `emoji-picker-react`.
