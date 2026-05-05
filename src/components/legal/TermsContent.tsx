export function TermsContent() {
  return (
    <div className="space-y-6 text-[14px] leading-relaxed text-ink-700">
      <header>
        <h2 className="text-[22px] font-semibold tracking-tight text-ink-900">
          FindEvo Terms of Service
        </h2>
        <p className="mt-1 text-[13px] text-ink-500">
          Effective Date: May 5, 2026 · Last Updated: May 5, 2026
        </p>
      </header>

      <Section title="1. Acceptance of Terms">
        <p>
          By accessing or using FindEvo (&ldquo;the Service&rdquo;) at findevo.com,
          you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
          If you do not agree to these Terms, please do not use the Service.
        </p>
        <p>
          FindEvo is operated by an individual founder based in Turkey. These
          Terms constitute the entire agreement between you and FindEvo regarding
          your use of the Service.
        </p>
      </Section>

      <Section title="2. Description of Service">
        <p>
          FindEvo is a SaaS tool that helps founders and small businesses find
          potential customers on Reddit by:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Analyzing your website URL to understand your product and target audience</li>
          <li>Identifying relevant Reddit communities (subreddits) for your product</li>
          <li>Surfacing Reddit posts where potential customers are discussing related problems</li>
          <li>Providing AI-generated approach guidance — strategic advice on how to engage authentically</li>
          <li>Tracking your outreach activity through a lead management system</li>
        </ul>
        <p className="rounded-xl border border-brand-500/30 bg-brand-50 px-3 py-2 text-[13.5px] text-brand-700">
          <strong>IMPORTANT:</strong> FindEvo provides strategic guidance, not
          ready-to-copy messages. You are responsible for all content you post
          on Reddit.
        </p>
      </Section>

      <Section title="3. Account Registration">
        <p>To use FindEvo, you must:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide a valid email address</li>
          <li>Create a secure password</li>
          <li>Be at least 18 years of age</li>
          <li>Have the authority to agree to these Terms on behalf of yourself or your organization</li>
        </ul>
        <p>
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activities that occur under your account.
          Notify us immediately at{" "}
          <a
            href="mailto:contact@findevo.com"
            className="font-medium text-brand-600 hover:text-brand-700"
          >
            contact@findevo.com
          </a>{" "}
          if you suspect unauthorized access.
        </p>
      </Section>

      <Section title="4. Beta Period and Future Pricing">
        <SubSection title="4.1 Free Beta">
          <p>
            FindEvo is currently in a free public beta. During this period — which
            runs for approximately 1 month from the launch date — all features
            are available at no cost. No credit card or payment information is
            required.
          </p>
        </SubSection>
        <SubSection title="4.2 Future Pricing">
          <p>
            After the beta period, FindEvo plans to introduce a paid subscription
            at <strong>$19.00 USD per month</strong>. We will notify all beta
            users by email at least 14 days before any paid plan takes effect.
            You will have the option to continue with a paid plan or cancel your
            account at no charge.
          </p>
        </SubSection>
        <SubSection title="4.3 Payment Processing (Future)">
          <p>
            When paid plans are introduced, payments will be processed by Lemon
            Squeezy, which acts as a Merchant of Record and handles tax compliance
            globally. We will update these Terms before any paid features are
            enabled.
          </p>
        </SubSection>
        <SubSection title="4.4 Cancellation">
          <p>
            You may cancel your account at any time through Settings &gt; Account
            &gt; Delete Account or by contacting{" "}
            <a
              href="mailto:contact@findevo.com"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              contact@findevo.com
            </a>
            . During the beta period, cancellation results in immediate account
            deletion with no charges.
          </p>
        </SubSection>
      </Section>

      <Section title="5. Acceptable Use">
        <SubSection title="5.1 You May Use FindEvo To">
          <ul className="list-disc space-y-1 pl-5">
            <li>Find potential customers for legitimate products and services</li>
            <li>Research Reddit communities relevant to your business</li>
            <li>Manage your outreach pipeline and track leads</li>
            <li>Generate approach guidance for authentic community engagement</li>
          </ul>
        </SubSection>
        <SubSection title="5.2 You May NOT Use FindEvo To">
          <ul className="list-disc space-y-1 pl-5">
            <li>Spam Reddit communities or send unsolicited bulk messages</li>
            <li>Violate Reddit&rsquo;s Terms of Service or any subreddit&rsquo;s rules</li>
            <li>Collect personal data from Reddit users without consent</li>
            <li>Engage in deceptive, misleading, or fraudulent marketing</li>
            <li>Promote illegal products, services, or activities</li>
            <li>Harass, stalk, or harm Reddit users</li>
            <li>Circumvent Reddit&rsquo;s rate limits or anti-spam measures</li>
            <li>Resell or sublicense access to FindEvo&rsquo;s AI outputs</li>
            <li>Use the Service for competitive intelligence against FindEvo</li>
          </ul>
        </SubSection>
        <SubSection title="5.3 Reddit Compliance">
          <p>
            You are solely responsible for ensuring your Reddit activity complies
            with Reddit&rsquo;s Terms of Service and the rules of each subreddit
            you engage in. FindEvo provides subreddit rule information as guidance
            only — always verify current rules before posting. FindEvo is not
            responsible for any account bans, post removals, or other consequences
            resulting from your Reddit activity.
          </p>
        </SubSection>
      </Section>

      <Section title="6. AI Usage Limits">
        <p>
          To ensure fair service for all users, the following daily limits apply:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Post scoring: <strong>100 posts per day</strong></li>
          <li>Approach guides: <strong>20 per day</strong></li>
          <li>Site analyses: <strong>5 per month</strong></li>
        </ul>
        <p>
          These limits may be adjusted as the service evolves. We will notify
          users of significant changes.
        </p>
      </Section>

      <Section title="7. Intellectual Property">
        <SubSection title="7.1 FindEvo's Property">
          <p>
            The FindEvo service, including its software, design, and AI systems,
            is owned by FindEvo and protected by intellectual property laws. You
            may not copy, modify, or reverse engineer any part of the Service.
          </p>
        </SubSection>
        <SubSection title="7.2 Your Content">
          <p>
            You retain ownership of any content you provide to FindEvo (website
            URLs, product descriptions, lead notes). By submitting content, you
            grant FindEvo a limited license to process and display it within the
            Service for the purpose of providing you with the features described.
          </p>
        </SubSection>
        <SubSection title="7.3 AI Outputs">
          <p>
            Approach guides and other AI-generated content produced by FindEvo on
            your behalf may be used by you for your outreach activities. You may
            not resell or sublicense these outputs as a standalone product or
            service.
          </p>
        </SubSection>
      </Section>

      <Section title="8. Reddit API and Data">
        <p>
          FindEvo accesses publicly available Reddit data through Reddit&rsquo;s
          API. Your use of Reddit data through FindEvo is subject to
          Reddit&rsquo;s Terms of Service and API policies. FindEvo makes no
          warranties regarding the availability, accuracy, or completeness of
          Reddit data. Reddit may change or restrict API access at any time,
          which may affect FindEvo&rsquo;s features.
        </p>
      </Section>

      <Section title="9. Disclaimers">
        <p className="text-[13.5px] uppercase tracking-wide text-ink-600">
          The Service is provided &ldquo;as is&rdquo; without warranties of any
          kind, express or implied. FindEvo does not warrant that:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>The Service will be uninterrupted or error-free</li>
          <li>AI-generated approach guidance will result in successful outreach or customer acquisition</li>
          <li>Reddit post data will be complete, accurate, or up to date</li>
          <li>Your use of the Service will comply with Reddit&rsquo;s terms or any subreddit&rsquo;s rules</li>
        </ul>
        <p className="rounded-xl border border-warning-500/30 bg-warning-50 px-3 py-2 text-[13.5px] text-ink-800">
          FINDEVO IS NOT RESPONSIBLE FOR ANY REDDIT ACCOUNT BANS, POST REMOVALS,
          OR OTHER CONSEQUENCES RESULTING FROM YOUR USE OF THE SERVICE.
        </p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, FindEvo shall not be liable for
          any indirect, incidental, special, consequential, or punitive damages,
          including lost profits, lost data, or business interruption, arising
          from your use of the Service.
        </p>
        <p>
          FindEvo&rsquo;s total liability to you for any claims arising from
          these Terms or your use of the Service shall not exceed the amount you
          paid to FindEvo in the 3 months preceding the claim.
        </p>
      </Section>

      <Section title="11. Termination">
        <p>We may suspend or terminate your account if you:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Violate these Terms of Service</li>
          <li>Use the Service to spam or harm others</li>
          <li>Engage in fraudulent activity</li>
          <li>Fail to comply with future payment obligations after the beta period ends</li>
        </ul>
        <p>
          You may terminate your account at any time by deleting it through
          Settings &gt; Account &gt; Delete Account. Upon termination, your data
          will be deleted in accordance with our Privacy Policy.
        </p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>
          We may update these Terms from time to time. We will notify you of
          significant changes by posting a notice on the app or by email at least
          14 days before changes take effect. Continued use of the Service after
          changes constitutes acceptance of the updated Terms.
        </p>
      </Section>

      <Section title="13. Governing Law">
        <p>
          These Terms are governed by the laws of the Republic of Turkey. Any
          disputes arising from these Terms shall be resolved in the courts of
          Istanbul, Turkey.
        </p>
      </Section>

      <Section title="14. Contact">
        <p>For questions about these Terms, please contact us at:</p>
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
