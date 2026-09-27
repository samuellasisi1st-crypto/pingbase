import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/LegalPage";

const title = "Terms of Service — Pingbase";
const description =
  "The terms that govern use of Pingbase, the AI booking concierge and unified messaging inbox for appointment-based businesses.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://pingbase.lovable.app/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://pingbase.lovable.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms govern use of Pingbase, a booking concierge and unified messaging inbox for appointment-based businesses. By creating an account or connecting a messaging channel, you agree to them."
    >
      <section>
        <h2>The service</h2>
        <p>
          Pingbase brings messages from channels such as WhatsApp, Instagram and Facebook Messenger
          into one inbox, lets an AI assistant answer questions and book appointments from your real
          availability, and lets your team take over a conversation at any time. Features may change
          or be withdrawn as the product develops.
        </p>
      </section>

      <section>
        <h2>Accounts</h2>
        <p>
          You must be at least 18 and authorised to act for the business you register. Keep your
          login details secure; you are responsible for activity under your account and for the team
          members you invite. Tell us promptly about any unauthorised access.
        </p>
      </section>

      <section>
        <h2>Connected channels</h2>
        <p>
          Connecting a channel authorises Pingbase to receive and send messages on your behalf
          through that platform. You must own or be authorised to manage the connected Page, account
          or phone number, and you must comply with that platform's own terms and messaging
          policies, including Meta's Platform Terms, WhatsApp Business Messaging Policy and the
          rules on messaging windows and template messages. A platform may suspend or limit your
          access independently of us.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>No unsolicited bulk messaging, spam or messaging people who have not opted in.</li>
          <li>No unlawful, harassing, deceptive, hateful or infringing content.</li>
          <li>No attempt to breach security, access other workspaces, or reverse engineer the service.</li>
          <li>No use of the service to impersonate another business or person.</li>
          <li>No automated scraping or resale of the service without our written permission.</li>
        </ul>
        <p>We may suspend accounts that breach these rules or put the platform at risk.</p>
      </section>

      <section>
        <h2>The AI assistant</h2>
        <p>
          The assistant answers from the services, prices, policies, knowledge and calendar you
          configure. You are responsible for keeping that information accurate and for the messages
          sent from your account, including those the assistant sends. Automated replies can contain
          errors; review important conversations and take over where judgement is needed. You can
          pause the assistant or switch any conversation to manual handling at any time.
        </p>
      </section>

      <section>
        <h2>Bookings, deposits and payments</h2>
        <p>
          Appointments, deposits, cancellation terms and refunds are contracts between you and your
          customer. Pingbase records and coordinates them but is not a party to them and does not
          provide the underlying service. Where a payment provider is connected, its own terms and
          fees apply.
        </p>
      </section>

      <section>
        <h2>Your data</h2>
        <p>
          You keep ownership of your business data, contacts and conversations. You grant us the
          licence needed to host, process and display that data to run the service. Our handling of
          personal data is described in the <a href="/privacy">Privacy Policy</a>. You are
          responsible for having a lawful basis for the customer data you bring into Pingbase and for
          giving your customers the notices they are due.
        </p>
      </section>

      <section>
        <h2>Availability and support</h2>
        <p>
          We aim for a reliable service but do not guarantee uninterrupted availability. Maintenance,
          third-party outages and platform changes can interrupt message delivery. Support is
          provided by email at <a href="mailto:support@pingbase.app">support@pingbase.app</a>.
        </p>
      </section>

      <section>
        <h2>Fees</h2>
        <p>
          Where a paid plan applies, fees, billing period and any usage limits are shown at sign-up.
          Fees are payable in advance and are non-refundable except where the law requires otherwise.
          We will give notice before changing prices.
        </p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          Pingbase, its software, design and branding remain ours. You receive a non-exclusive,
          non-transferable right to use the service while your account is active.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          The service is provided "as is" to the extent the law allows. We are not liable for
          indirect or consequential loss, lost profits, lost bookings or lost data, and our total
          liability in any 12-month period is limited to the fees you paid in that period. Nothing
          here limits liability for death or personal injury caused by negligence, fraud, or anything
          else that cannot lawfully be limited.
        </p>
      </section>

      <section>
        <h2>Ending the agreement</h2>
        <p>
          You may close your account at any time. We may suspend or end access for breach of these
          terms, non-payment, or where required by law or a platform provider. On termination your
          data is deleted in line with the retention periods in the Privacy Policy; export anything
          you need first.
        </p>
      </section>

      <section>
        <h2>Changes and governing law</h2>
        <p>
          We may update these terms and will notify account holders of material changes. Continued
          use after the change takes effect means acceptance. These terms are governed by the laws of
          England and Wales, and the courts of England and Wales have exclusive jurisdiction.
        </p>
      </section>
    </LegalPage>
  );
}
