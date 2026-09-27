import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/LegalPage";

const title = "Privacy Policy — Pingbase";
const description =
  "How Pingbase collects, uses, stores and deletes customer messaging and booking data, including data received from Meta platforms.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://pingbase.lovable.app/privacy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://pingbase.lovable.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="Pingbase is a booking concierge used by appointment-based businesses to receive and reply to customer messages across WhatsApp, Instagram, Facebook Messenger and other channels. This policy explains what information we handle, why we handle it, how long we keep it, and how it can be deleted."
    >
      <section>
        <h2>Who we are</h2>
        <p>
          Pingbase provides the software. The business you messaged (for example a salon or clinic)
          decides what to do with your conversation and your booking, and is the data controller for
          that information. Pingbase acts as their data processor. For our own account holders and
          website visitors, Pingbase is the controller.
        </p>
        <p>
          Contact: <a href="mailto:support@pingbase.app">support@pingbase.app</a>
        </p>
      </section>

      <section>
        <h2>Information we handle</h2>
        <ul>
          <li>
            <strong>Messages.</strong> The content of messages you send to a business through a
            connected channel, plus timestamps, message IDs and delivery status.
          </li>
          <li>
            <strong>Contact details.</strong> Your name or platform display name, profile picture URL,
            channel ID (for example your WhatsApp number or Instagram-scoped user ID), and any email
            address or phone number you provide while booking.
          </li>
          <li>
            <strong>Booking information.</strong> Services requested, appointment dates and times,
            staff member, notes, deposits and payment status.
          </li>
          <li>
            <strong>Business account data.</strong> Account holder name, email address, workspace
            settings, team members, and the access tokens needed to send and receive messages on the
            business's behalf.
          </li>
          <li>
            <strong>Technical logs.</strong> Delivery errors, webhook events and diagnostic logs used
            to keep the service reliable and secure.
          </li>
        </ul>
        <p>
          We do not knowingly collect special category data. Please do not send health, financial or
          identity documents through chat.
        </p>
      </section>

      <section>
        <h2>Data we receive from Meta platforms</h2>
        <p>
          When a business connects WhatsApp Business, Instagram or Facebook Messenger, Pingbase
          receives from Meta only what is needed to run the conversation: the connected Page or
          account identity, incoming and outgoing message content, message and sender identifiers,
          and delivery or read status. We use this data solely to display the conversation in the
          business's inbox, let the AI assistant answer and book appointments, and send replies back
          through the same channel.
        </p>
        <p>
          We do not use Meta platform data for advertising, profiling, resale, or to build
          independent datasets, and we do not transfer it to data brokers.
        </p>
      </section>

      <section>
        <h2>Why we handle it</h2>
        <ul>
          <li>To deliver your messages to the business and their replies back to you.</li>
          <li>To answer questions, check real availability and create, change or cancel bookings.</li>
          <li>To send booking confirmations, reminders and follow-ups through the channel you used.</li>
          <li>To keep one customer profile per person, so history is not lost between channels.</li>
          <li>To secure the service, prevent abuse and fix faults.</li>
        </ul>
        <p>
          Our legal bases are performance of a contract, our legitimate interest in operating a
          reliable service, and consent where required for marketing messages.
        </p>
      </section>

      <section>
        <h2>Automated replies</h2>
        <p>
          Conversations may be answered by an AI assistant. It only answers from the business's own
          services, prices, policies and live calendar, and a member of staff can take over at any
          point. You can ask for a human at any time. No decision with a legal or similarly
          significant effect is made by automation alone.
        </p>
      </section>

      <section>
        <h2>Sharing</h2>
        <p>
          We share information with the business you contacted, and with service providers who help
          us run Pingbase: cloud hosting and database infrastructure, the messaging platforms
          themselves (Meta and others), AI model providers used to draft replies, and payment
          providers when a deposit is taken. Providers act on our instructions under contract. We may
          disclose information where the law requires it.
        </p>
      </section>

      <section>
        <h2>Storage, security and international transfers</h2>
        <p>
          Data is stored in managed cloud infrastructure with encryption in transit and at rest.
          Access tokens and platform secrets are held server-side and are never exposed to the
          browser. Access is restricted to the business's own workspace and to authorised Pingbase
          staff for support and maintenance. Some providers operate outside the UK/EEA; those
          transfers rely on Standard Contractual Clauses or an equivalent safeguard.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <ul>
          <li>Conversations and contact records: while the business's account is active, unless deleted sooner.</li>
          <li>Appointment and payment records: up to 6 years, where needed for accounting and dispute handling.</li>
          <li>Technical and delivery logs: up to 90 days.</li>
          <li>After an account is closed, remaining data is deleted within 30 days.</li>
        </ul>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          Under UK and EU data protection law you may request access to your data, correction,
          deletion, restriction, portability, and object to certain processing. You may also withdraw
          consent to marketing messages at any time. Requests about a conversation are best sent to
          the business you messaged; you can also contact us and we will pass it on or act on it.
          You have the right to complain to the UK Information Commissioner's Office or your local
          supervisory authority.
        </p>
      </section>

      <section id="data-deletion">
        <h2>Deleting your data</h2>
        <p>
          You can ask for all data linked to you to be deleted at any time, including messages,
          contact details, booking history and any data we received from Meta about you.
        </p>
        <ul>
          <li>
            Email <a href="mailto:support@pingbase.app">support@pingbase.app</a> with the subject
            "Data deletion request", from the email address you used, or including the phone number
            or account name you messaged from, so we can identify your records.
          </li>
          <li>
            Alternatively, reply in the chat asking for your data to be deleted; the request is
            flagged to the business and to us.
          </li>
          <li>
            Business account holders can delete individual contacts and their conversation history
            directly from the Contacts area of Pingbase, or ask us to delete the entire workspace.
          </li>
        </ul>
        <p>
          We confirm receipt within 5 working days and complete deletion within 30 days, apart from
          records we must retain by law (for example invoices). Removing the Pingbase app from a
          Facebook or Instagram account also triggers deletion of the data we hold for that
          connection.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>
          Pingbase is not intended for children under 13, and we do not knowingly collect their data.
          If you believe a child's data has been sent to us, contact us and we will delete it.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update this policy. Material changes will be notified to account holders, and the
          date at the top of this page will change.
        </p>
      </section>
    </LegalPage>
  );
}
