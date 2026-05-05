export function PrivacyPolicyContent() {
  return (
    <div className="space-y-6 text-[14px] leading-relaxed text-ink-700">
      <header>
        <h2 className="text-[22px] font-semibold tracking-tight text-ink-900">
          FindEvo Privacy Policy
        </h2>
        <p className="mt-1 text-[13px] text-ink-500">
          Effective Date: May 5, 2026 · Last Updated: May 5, 2026
        </p>
      </header>

      <Section title="1. Introduction">
        <p>
          Welcome to FindEvo (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).
          FindEvo is operated by an individual founder based in Turkey. This
          Privacy Policy explains how we collect, use, and protect your personal
          information when you use our service at findevo.com.
        </p>
        <p>
          By using FindEvo, you agree to the collection and use of information in
          accordance with this policy.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <SubSection title="2.1 Information You Provide">
          <ul className="list-disc space-y-1 pl-5">
            <li>Account information: email address and password (via Supabase Auth)</li>
            <li>Product information: your website URL, product description, and target audience</li>
            <li>Onboarding survey answers: your goals, target audience type, industry, and outreach preferences</li>
            <li>Subreddit preferences: the subreddits you choose to monitor</li>
            <li>Lead notes: any notes you add to your lead tracker</li>
          </ul>
        </SubSection>

        <SubSection title="2.2 Information Collected Automatically">
          <ul className="list-disc space-y-1 pl-5">
            <li>Usage data: pages visited, features used, actions taken within the app</li>
            <li>AI usage: number of post scores, approach guides, and site analyses performed</li>
            <li>Browser and device information for security and session management</li>
          </ul>
        </SubSection>

        <SubSection title="2.3 Third-Party Data">
          <ul className="list-disc space-y-1 pl-5">
            <li>Reddit post data: publicly available Reddit posts fetched via Reddit&rsquo;s public API</li>
            <li>Website content: publicly available content from URLs you submit for analysis</li>
          </ul>
        </SubSection>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use your information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide and operate the FindEvo service</li>
          <li>Analyze your product and suggest relevant subreddits and keywords</li>
          <li>Score Reddit posts for relevance to your product</li>
          <li>Generate approach guides to help you engage authentically on Reddit</li>
          <li>Track your outreach activity and lead pipeline</li>
          <li>Enforce AI usage limits to ensure fair service for all users</li>
          <li>Improve our service and fix technical issues</li>
          <li>Communicate service updates or important changes</li>
        </ul>
      </Section>

      <Section title="4. AI Processing">
        <p>
          FindEvo uses OpenRouter (powered by OpenAI&rsquo;s GPT-4o-mini model) to
          analyze websites, score Reddit posts, and generate approach guidance.
          When you submit a URL or trigger AI analysis:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your website content and product information are sent to OpenRouter for processing</li>
          <li>Reddit post content is sent to OpenRouter for scoring</li>
          <li>We do not use your data to train AI models</li>
          <li>OpenRouter processes data under their own privacy policy</li>
        </ul>
        <p className="rounded-xl border border-brand-500/30 bg-brand-50 px-3 py-2 text-[13.5px] text-brand-700">
          FindEvo does <strong>NOT</strong> generate ready-to-copy messages. All
          AI outputs are strategic guidance — you write your own responses.
        </p>
      </Section>

      <Section title="5. Data Storage and Security">
        <p>
          Your data is stored securely using Supabase (PostgreSQL database) with
          the following protections:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Row-Level Security (RLS): your data is isolated and only accessible by your account</li>
          <li>Encrypted connections (HTTPS/TLS) for all data transmission</li>
          <li>Scored Reddit posts are automatically deleted after 24 hours unless saved as leads</li>
          <li>We do not store Reddit passwords or OAuth tokens on your behalf</li>
        </ul>
      </Section>

      <Section title="6. Data Sharing">
        <p>We do not sell your personal data. We share data only with:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase: database and authentication infrastructure</li>
          <li>OpenRouter / OpenAI: AI processing of website and post content</li>
          <li>Lemon Squeezy: payment processing (when paid plans are introduced in the future)</li>
          <li>Vercel: hosting infrastructure (no personal data stored)</li>
        </ul>
        <p>
          We do not share your data with advertisers, data brokers, or any other
          third parties.
        </p>
      </Section>

      <Section title="7. Payment Data">
        <p>
          FindEvo is currently in a free beta period. No payment information is
          collected at this time. When we introduce paid plans in the future,
          payments will be processed by Lemon Squeezy, which acts as a Merchant
          of Record. We will update this policy before any paid features are
          enabled.
        </p>
      </Section>

      <Section title="8. Reddit Data">
        <p>
          FindEvo accesses publicly available Reddit posts through Reddit&rsquo;s
          API. We do not:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Access private Reddit messages or non-public content</li>
          <li>Store Reddit user data beyond what is visible in public posts</li>
          <li>Create profiles of Reddit users</li>
          <li>Use Reddit data for any purpose other than helping you find relevant conversations</li>
        </ul>
        <p>
          Scored posts are automatically purged after 24 hours unless you add
          them to your lead tracker.
        </p>
      </Section>

      <Section title="9. Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Access:</strong> request a copy of your personal data</li>
          <li><strong>Correction:</strong> update inaccurate information via your account settings</li>
          <li><strong>Deletion:</strong> delete your account and all associated data via Settings &gt; Account &gt; Delete Account</li>
          <li><strong>Data portability:</strong> request an export of your data</li>
          <li><strong>Objection:</strong> object to certain types of data processing</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a
            href="mailto:contact@findevo.com"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            contact@findevo.com
          </a>
          .
        </p>
      </Section>

      <Section title="10. Data Retention">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account data: retained until you delete your account</li>
          <li>Scored posts: automatically deleted after 24 hours (unless converted to leads)</li>
          <li>Lead data: retained until you delete your account or manually remove leads</li>
          <li>AI usage logs: retained for 90 days for rate limiting purposes</li>
        </ul>
      </Section>

      <Section title="11. Cookies">
        <p>
          FindEvo uses session cookies for authentication (via Supabase). We do
          not use tracking cookies, advertising cookies, or third-party analytics
          cookies. You can disable cookies in your browser, but this will prevent
          you from logging in.
        </p>
      </Section>

      <Section title="12. Children's Privacy">
        <p>
          FindEvo is not intended for users under 18 years of age. We do not
          knowingly collect personal information from minors. If you believe a
          minor has provided us with personal information, please contact us
          immediately.
        </p>
      </Section>

      <Section title="13. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you
          of significant changes by posting a notice on the app or by email.
          Continued use of FindEvo after changes constitutes acceptance of the
          updated policy.
        </p>
      </Section>

      <Section title="14. Contact Us">
        <p>If you have questions about this Privacy Policy, please contact us at:</p>
        <ul className="list-none space-y-1">
          <li>
            Email:{" "}
            <a
              href="mailto:contact@findevo.com"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              contact@findevo.com
            </a>
          </li>
          <li>Website: findevo.com</li>
        </ul>
        <p className="text-[13px] text-ink-500">
          FindEvo is operated by an individual founder based in Istanbul, Turkey.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[15px] font-semibold text-ink-900">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-[14px] font-medium text-ink-800">{title}</h4>
      {children}
    </div>
  );
}
