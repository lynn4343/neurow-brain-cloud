"use client";

// ---------------------------------------------------------------------------
// PrivacyPolicyContent — Full Neurow Privacy Policy (v3)
//
// Renders the complete 19-section privacy policy as React components.
// Source: Data_Privacy_Legal/Privacy_Policy_v3.md
// Governing decision: BD-001 — "Full Access, Curated Format"
// Export claims verified against: Export_Inventory.md (2026-03-07)
// Legal review: Mar 7 (initial), Mar 8 (second pass)
// ---------------------------------------------------------------------------

function SectionHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-sm font-semibold text-[#1E1E1E] mt-8 mb-3">
      {children}
    </h3>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-medium text-[#1E1E1E] mt-5 mb-2">
      {children}
    </h4>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
      {children}
    </p>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-[#1E1E1E]">{children}</span>;
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-[#FAFAF9] border border-[#E6E5E3] px-4 py-3 my-4">
      {children}
    </div>
  );
}

function PolicyTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left text-[#1E1E1E] font-medium py-2 px-3 border-b border-[#E6E5E3] bg-[#FAFAF9]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="text-muted-foreground py-2 px-3 border-b border-[#E6E5E3] align-top"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-muted-foreground my-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/40" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2 text-sm text-muted-foreground my-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="flex-shrink-0 font-medium text-[#1E1E1E] w-4 text-right">
            {i + 1}.
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Divider() {
  return <div className="h-px bg-[#E6E5E3] my-6" />;
}

export function PrivacyPolicyContent() {
  return (
    <div className="space-y-0">
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[#1E1E1E] mb-2">
          Data &amp; Privacy
        </h2>
        <p className="text-xs text-muted-foreground">
          Effective March 9, 2026 &middot; Last updated March 8, 2026
        </p>
      </div>

      {/* ================================================================ */}
      {/* OUR POSITION                                                     */}
      {/* ================================================================ */}
      <Callout>
        <p className="text-sm font-medium text-[#1E1E1E] mb-2">
          Everything about you is yours. How we help you is ours.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This is the foundational design constraint of everything Neurow builds.
          Your memories, your coaching sessions, your behavioral patterns, the
          insights we generate about you &mdash; all of it belongs to you. You
          can inspect it, export it, transfer it to another service, or delete it
          permanently. At any time. Without asking permission.
        </p>
      </Callout>

      <P>
        What remains ours is how we help you: the coaching methodology, the
        algorithms, and the architecture that structures your information.
      </P>

      <P>
        Our architecture is designed to meet or exceed the data protection
        standards set by GDPR, CCPA, the Texas Data Privacy and Security Act,
        and the emerging provisions of the EU AI Act &mdash; but compliance is
        our floor, not our ceiling. Where the law is silent, we default to the
        position that gives you more control, not less.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 1. DESIGN PRINCIPLES                                             */}
      {/* ================================================================ */}
      <SectionHeading id="design-principles">
        1. Design Principles
      </SectionHeading>

      <P>
        These eight commitments govern every data decision Neurow makes. They are
        architectural &mdash; enforced by system design, not just policy.
      </P>

      <NumberedList
        items={[
          <><Strong>Advisory, not directive.</Strong> Neurow guides. You decide. We surface patterns and insights to inform your thinking. We never make decisions that produce legal, financial, or similarly significant effects on your behalf. This is not a limitation &mdash; it is the product.</>,
          <><Strong>Behavioral analysis, not emotion recognition.</Strong> We analyze self-reported data and behavioral patterns you share in coaching sessions. We do not perform biometric emotion detection, sentiment analysis from facial expressions, or any form of emotion recognition from physiological data.</>,
          <><Strong>Explicit consent for sensitive data.</Strong> Behavioral patterns, emotional states, and health information shared in coaching sessions receive their own consent &mdash; separate from general terms, specific in purpose, and withdrawable at any time.</>,
          <><Strong>AI disclosure at first interaction.</Strong> You know you are interacting with AI from the moment you open Neurow. This is stated in onboarding, visible in the interface, and restated here: Neurow is an AI coaching system. You are interacting with artificial intelligence, not a human coach.</>,
          <><Strong>No third-party data sharing.</Strong> Your personal data is not sold, not shared for advertising, not provided to data brokers, and not used for cross-account analysis. The only third parties that process your data are the AI providers described in Section 5, and only for the specific purposes disclosed there.</>,
          <><Strong>Deletion means deletion.</Strong> When you delete your data, it is removed from all four Brain Cloud stores. Not archived. Not soft-deleted. Not retained for model training. Gone.</>,
          <><Strong>Probabilistic, not deterministic.</Strong> Coaching insights are framed as patterns and observations &mdash; never as diagnoses, certainties, or clinical assessments. &quot;You tend to avoid financial topics when stressed&quot; is an observation. It is not a diagnosis.</>,
          <><Strong>Designed for future regulation.</Strong> We build for 2028 law, not 2026 law. Being ahead of regulation is cheaper than catching up, and it is better for you.</>,
        ]}
      />

      <Divider />

      {/* ================================================================ */}
      {/* 2. WHAT YOU OWN AND WHAT WE KEEP                                 */}
      {/* ================================================================ */}
      <SectionHeading id="ownership">
        2. What You Own and What We Keep
      </SectionHeading>

      <P>
        The line between your data and our methodology is clear, consistent, and
        designed to be generous toward you.
      </P>

      <SubHeading>What&apos;s Yours &mdash; Full Access, Export, Delete, Transfer</SubHeading>

      <PolicyTable
        headers={["Category", "Examples", "Your Rights"]}
        rows={[
          [
            "Input Data",
            "Everything you type, say, or import \u2014 coaching conversations, goals, plans, reflections, notes, calendar entries, data imported from other AI providers or files",
            "Full access, download, delete, transfer",
          ],
          [
            "Output Data",
            "AI-generated coaching responses, session summaries, morning briefs \u2014 content co-created between you and the coaching system",
            "Full access, download, delete, transfer",
          ],
          [
            "Observed Data",
            "Usage patterns and activity captured during your coaching sessions \u2014 session frequency, engagement timing, feature usage",
            "Full access, download, delete, transfer",
          ],
          [
            "Derived Data",
            "Behavioral patterns identified from your coaching history, coaching insights, progress tracking \u2014 generated by our processing of your Input, Output, and Observed Data",
            "Full access, download, delete, transfer",
          ],
        ]}
      />

      <P>
        The first three categories follow the Data Transfer Initiative&apos;s
        framework for AI personal data. Input Data is what you provide. Output
        Data is what the AI generates in conversation with you. Observed Data is
        activity passively captured during your use of the service.
      </P>

      <P>
        GDPR Article 20 requires portability of data you provided (Input Data)
        and data passively observed during automated processing (Observed Data).
        Output Data &mdash; AI-generated coaching responses &mdash; is
        technically controller work product under Article 20.{" "}
        <Strong>We make it portable anyway,</Strong> because it is about your
        life, not ours.
      </P>

      <P>
        The fourth category &mdash; Derived Data &mdash; is where we go further
        still. Under GDPR Article 20, derived data is the controller&apos;s work
        product and is not required to be portable. DTI&apos;s portability
        framework similarly distinguishes it from data the user provided or that
        was passively observed. <Strong>We export it anyway.</Strong> Behavioral
        patterns and coaching insights are derived from your life. We believe
        they belong to you, regardless of what current regulation or portability
        frameworks require. This is a deliberate choice, not a legal obligation.
      </P>

      <SubHeading>The Gray Area &mdash; Made Tangible</SubHeading>

      <P>
        The distinction between &quot;yours&quot; and &quot;ours&quot; is an
        instance vs. schema test:
      </P>

      <BulletList
        items={[
          <><Strong>&quot;You tend to abandon goals on Wednesdays&quot;</Strong> &mdash; this is yours. A specific observation about your behavior, derived from your data. You can see it, export it, correct it, or delete it.</>,
          <><Strong>The algorithm that detected the Wednesday pattern</Strong> &mdash; this is ours. Coaching intelligence that analyzes behavioral sequences across sessions to surface non-obvious patterns. It exists independently of any individual user&apos;s data.</>,
          <><Strong>&quot;Your energy drops after weeks without exercise&quot;</Strong> &mdash; yours. A behavioral pattern identified from your coaching history.</>,
        ]}
      />

      <P>
        When in doubt, we apply a simple rule:{" "}
        <Strong>if it&apos;s about you, it&apos;s yours.</Strong> If it&apos;s
        about how we help everyone, it&apos;s ours.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 3. WHAT WE COLLECT                                               */}
      {/* ================================================================ */}
      <SectionHeading id="collection">3. What We Collect</SectionHeading>

      <SubHeading>Data You Provide (Input Data)</SubHeading>

      <BulletList
        items={[
          "Profile information (name, coaching preferences, focus areas)",
          "Coaching session conversations (your messages and AI responses)",
          "Goals, tasks, and priorities you set",
          "Notes and reflections you write",
          "Data you import from other AI providers or files (ChatGPT, Gemini, Claude exports; JSONL/JSON file imports)",
        ]}
      />

      <P>
        <Strong>Legal basis:</Strong> Contract performance &mdash; you signed up
        for a coaching service, and processing this data is necessary to deliver
        it (GDPR Article 6.1(b)).
      </P>

      <SubHeading>Data Generated During Your Use (Output + Observed + Derived Data)</SubHeading>

      <BulletList
        items={[
          <><Strong>Output Data:</Strong> AI-generated coaching responses, session summaries, and morning briefs produced during your sessions</>,
          <><Strong>Observed Data:</Strong> Session frequency, engagement timing, and feature usage patterns captured during normal operation</>,
          <><Strong>Derived Data:</Strong> Behavioral patterns identified from your coaching history, coaching insights, and progress tracking</>,
        ]}
      />

      <P>
        <Strong>Legal basis:</Strong> Behavioral pattern processing may
        constitute sensitive personal data under GDPR Article 9 &mdash;
        particularly where coaching sessions touch on health conditions,
        emotional states, or behavioral patterns related to mental wellbeing.
        Processing of derived behavioral data requires your{" "}
        <Strong>explicit consent</Strong>, obtained separately from general terms
        acceptance (GDPR Article 9.2(a)). You may withdraw this consent at any
        time through Settings, and withdrawal does not affect the lawfulness of
        processing performed before withdrawal.
      </P>

      <SubHeading>Data We Do Not Collect</SubHeading>

      <BulletList
        items={[
          "Location or GPS data",
          "Biometric data (facial recognition, voice prints, physiological signals)",
          "Browsing history or device fingerprints",
          "Cookies, tracking pixels, or web analytics (the desktop application does not use browser-based tracking technologies)",
          "Data from other users or cross-account information",
          "Any data for behavioral advertising purposes",
          "Data beyond what is necessary for coaching delivery",
        ]}
      />

      <Divider />

      {/* ================================================================ */}
      {/* 4. HOW WE USE YOUR DATA                                          */}
      {/* ================================================================ */}
      <SectionHeading id="usage">4. How We Use Your Data</SectionHeading>

      <P>
        Your data serves one purpose: <Strong>to coach you.</Strong>
      </P>

      <PolicyTable
        headers={["Processing Activity", "What It Does", "Legal Basis"]}
        rows={[
          ["Coaching delivery", "Generating personalized coaching responses informed by your history and context", "Contract (Art. 6.1(b))"],
          ["Memory extraction", "Parsing your conversations and imported data into structured memories \u2014 facts, entities, categories, dates", "Contract (Art. 6.1(b))"],
          ["Pattern recognition", "Identifying behavioral patterns across your coaching sessions to surface insights", "Explicit consent (Art. 9.2(a))"],
          ["Knowledge graph construction", "Connecting your information into a structured graph that enables deeper, more contextual coaching", "Contract (Art. 6.1(b)); Explicit consent (Art. 9.2(a)) for sensitive categories"],
          ["Progress tracking", "Measuring behavioral change over time to inform the coaching approach", "Explicit consent (Art. 9.2(a))"],
        ]}
      />

      <P>
        <Strong>What we do NOT use your data for:</Strong>
      </P>

      <BulletList
        items={[
          "Training or improving AI models (Section 7)",
          "Targeted advertising or behavioral advertising of any kind",
          "Profiling for third parties",
          "Sale to data brokers",
          "Cross-account analysis or aggregation at the individual level",
          "Making automated decisions that produce legal or similarly significant effects concerning you",
        ]}
      />

      <P>
        <Strong>Advisory architecture:</Strong> Neurow surfaces patterns and
        observations. It does not make consequential decisions on your behalf. If
        Neurow identifies that your spending increases during high-stress
        periods, it will raise this as a coaching observation. It will not freeze
        your credit card, notify your employer, or take any action beyond the
        coaching conversation. This is architecturally enforced, not merely a
        policy commitment.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 5. THIRD-PARTY AI PROCESSING                                     */}
      {/* ================================================================ */}
      <SectionHeading id="third-party">
        5. Third-Party AI Processing
      </SectionHeading>

      <P>
        Neurow uses third-party AI models at two points in its processing
        pipeline. Here is exactly what happens at each.
      </P>

      <SubHeading>Coaching Conversations &mdash; Anthropic (Claude)</SubHeading>

      <BulletList
        items={[
          <><Strong>Provider:</Strong> Anthropic, accessed via their commercial API tier</>,
          <><Strong>What they receive:</Strong> The content of your active coaching conversation, plus relevant context retrieved from your Brain Cloud for that specific session</>,
          <><Strong>What they do NOT receive:</Strong> Your full Brain Cloud memory store, your complete knowledge graph, behavioral patterns from other sessions, or data from other users</>,
          <><Strong>Their retention:</Strong> Anthropic&apos;s commercial API tier does not use inputs or outputs to train models. Conversation data is retained for up to 30 days for trust and safety purposes per their published data handling policies.</>,
        ]}
      />

      <SubHeading>Memory Extraction &mdash; OpenAI</SubHeading>

      <BulletList
        items={[
          <><Strong>Provider:</Strong> OpenAI, accessed via their API</>,
          <><Strong>What they receive:</Strong> Text content from your coaching conversations and imported data, sent for structured extraction &mdash; parsing facts, entities, categories, and dates into Brain Cloud memories</>,
          <><Strong>What they do NOT receive:</Strong> Your full Brain Cloud memory store, knowledge graph, or data from other users. Each extraction request processes a single piece of content.</>,
          <><Strong>Their retention:</Strong> OpenAI&apos;s API tier does not use inputs or outputs to train models. Data is retained in abuse monitoring logs for up to 30 days per their published data handling policies.</>,
        ]}
      />

      <SubHeading>Bring Your Own Key (BYOK)</SubHeading>

      <P>
        When you configure your own API key (Settings &gt; Model Configuration),
        you establish a direct relationship with your chosen provider for
        coaching conversation processing. Neurow remains the data controller (we
        determine the purpose and means of processing your Brain Cloud data),
        but the AI provider relationship shifts &mdash; your chosen provider
        processes conversation data under your API agreement with them, not ours.
        We support Anthropic, OpenAI, NVIDIA, and custom OpenAI-compatible
        endpoints. We recommend reviewing your chosen provider&apos;s data
        handling practices. Neurow cannot guarantee the data protection standards
        of providers accessed through your own API key, and your chosen
        provider&apos;s policies &mdash; not ours &mdash; govern their
        processing of your conversation data.
      </P>

      <SubHeading>What Stays in Your Brain Cloud</SubHeading>

      <P>
        Your memories, behavioral patterns, and session history are stored in
        your Brain Cloud. They are not transmitted to AI providers in bulk. Only
        the specific content needed for an active coaching conversation or a
        single extraction request is sent &mdash; and only for the duration of
        that operation.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 6. YOUR BRAIN CLOUD                                              */}
      {/* ================================================================ */}
      <SectionHeading id="brain-cloud">6. Your Brain Cloud</SectionHeading>

      <P>
        Brain Cloud is the structured memory system that powers your coaching
        experience. It stores your data across four specialized systems, each
        serving a distinct cognitive function:
      </P>

      <BulletList
        items={[
          <><Strong>Structured storage (Supabase)</Strong> &mdash; your profile, session records, goals, factual data, and structured metadata</>,
          <><Strong>Knowledge graph (Neo4j)</Strong> &mdash; relationships between your information: how goals connect to behaviors, how patterns relate to outcomes, how different domains of your life intersect</>,
          <><Strong>Semantic memory (Mem0)</Strong> &mdash; natural-language memories and contextual understanding for coaching conversations</>,
          <><Strong>Associative memory (Qdrant)</Strong> &mdash; similarity-based connections that surface relevant past experiences when you&apos;re working through new challenges</>,
        ]}
      />

      <P>
        <Strong>You can inspect the data about you</Strong> at any time through
        the Knowledge Graph view in the app. The information Neurow has stored
        about you &mdash; your memories, your behavioral patterns, your coaching
        history, the connections between different areas of your life &mdash; is
        visible, transparent, and under your control. You can correct any
        information you believe is inaccurate, or request deletion of any data
        point.
      </P>

      <P>
        <Strong>All personal data stored in your Brain Cloud belongs to you.</Strong>{" "}
        This includes data you entered directly AND insights generated from your
        data. The Brain Cloud architecture itself &mdash; how we structure,
        organize, and connect your data across the four stores &mdash; is our
        engineering, not user data. You own what&apos;s about you. We built how
        it&apos;s organized. This is designed to address the transparency
        requirements of GDPR Article 15 (right of access) and Minnesota&apos;s
        &quot;right to question&quot; profiling logic &mdash; the most GDPR-like
        provision in US state law.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 7. AI TRAINING                                                   */}
      {/* ================================================================ */}
      <SectionHeading id="ai-training">7. AI Training</SectionHeading>

      <Callout>
        <p className="text-sm font-medium text-[#1E1E1E]">
          Neurow does not use your personal data to train or improve AI models
          &mdash; by default, by opt-in, or at all.
        </p>
      </Callout>

      <BulletList
        items={[
          "We do not train on your data by default.",
          "We do not offer an opt-in to training on your data.",
          "We do not share your data with third parties for training purposes.",
        ]}
      />

      <P>
        If we ever revisited this position, any change would require direct
        notification to you and your affirmative opt-in before any new
        processing begins &mdash; not a quiet policy update, not a pre-checked
        box, and not retroactive application to data already collected under
        this policy. Per FTC guidance: &quot;Quietly updating privacy notices to
        adopt more permissive data practices could be an unfair or deceptive
        practice.&quot;
      </P>

      <P>
        Your coaching data is too personal for any other approach.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 8. DATA PORTABILITY                                              */}
      {/* ================================================================ */}
      <SectionHeading id="portability">8. Data Portability</SectionHeading>

      <P>
        You have the right to take your data with you. We didn&apos;t bolt
        portability onto the product &mdash; we built the product around it.
        Export is not a compliance checkbox. It is a confidence signal: a user
        who can leave but stays is a user who values the service.
      </P>

      <SubHeading>Export &mdash; Download Your Data</SubHeading>

      <P>
        You can export your personal data at any time (Settings &gt; Your Data
        &gt; Export). The export is delivered as a structured, machine-readable
        JSON file directly to your device. Per GDPR Article 20, you have the
        right to receive your personal data &quot;in a structured, commonly used
        and machine-readable format&quot; and to &quot;transmit that data to
        another controller without hindrance.&quot;
      </P>

      <P>
        <Strong>What you receive:</Strong>
      </P>

      <BulletList
        items={[
          "All memories, notes, and reflections \u2014 the content about you stored in your Brain Cloud",
          "Complete coaching session history \u2014 your messages, AI responses, and goal cascades",
          "Behavioral patterns, coaching insights, and observations that have been surfaced to you",
          "Your full profile and preferences",
          "Category metadata across all your memories",
        ]}
      />

      <P>
        <Strong>What is NOT included in exports:</Strong>
      </P>

      <BulletList
        items={[
          "The Brain Cloud graph architecture \u2014 node types, relationship types, traversal patterns, and the ontology that structures your knowledge graph. This is our engineering (Section 2).",
          "Neurow\u2019s coaching prompt templates and methodology (loaded at runtime, never in export)",
          "Signal detection algorithms and scoring models",
          "Vector embeddings and similarity indexes",
          "Our coaching framework and behavioral science approach",
        ]}
      />

      <P>
        The export delivers your data as flat, structured content &mdash; your
        memories, your coaching history, your behavioral insights, readable and
        portable. You get everything about you. We keep how we organized it.
      </P>

      <SubHeading>Interoperability &mdash; MCP (Open Protocol)</SubHeading>

      <P>
        Export gives you a file. Interoperability gives you a choice of AI.
      </P>

      <P>
        Brain Cloud is built on MCP (Model Context Protocol) &mdash; an open
        agent-to-agent interoperability standard. Any MCP-compatible AI service
        can connect directly to your Brain Cloud and access your data where it
        lives. This is how Neurow itself connects &mdash; through the same open
        protocol any other AI can use.
      </P>

      <P>
        This means you do not have to export and re-import to switch AI
        providers. Your Brain Cloud stays intact. You connect a different AI to
        it. Your data doesn&apos;t move &mdash; your AI does.
      </P>

      <P>
        Brain Cloud also accepts DTP-formatted imports (Data Transfer Project
        &mdash; the open data format standard powering Google Takeout and other
        major portability tools), giving you a path to bring data in from other
        services.
      </P>

      <SubHeading>Exceeds the Standard</SubHeading>

      <P>
        GDPR Article 20 requires portability of data you{" "}
        <em>provided</em> (Input Data) and data passively observed during
        automated processing (Observed Data). It does not require portability of
        Derived Data &mdash; behavioral patterns, coaching insights, and
        inferences generated through our processing.
      </P>

      <P>
        <Strong>We export Derived Data anyway.</Strong> Behavioral patterns and
        coaching insights are generated by our processing, but they are derived
        from your life. We believe they belong to you regardless of what current
        regulation requires.
      </P>

      <P>
        We are DTI-aligned across all five AI Transfer Principles (Section 14).
        We don&apos;t meet the standard. We exceed it.
      </P>

      <P>
        <Strong>Response time:</Strong> GDPR Article 12 requires response within
        30 days. In practice, our export is instant and self-service.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 9. YOUR RIGHTS                                                   */}
      {/* ================================================================ */}
      <SectionHeading id="rights">9. Your Rights</SectionHeading>

      <PolicyTable
        headers={["Right", "What It Means", "How to Exercise"]}
        rows={[
          ["Access (GDPR Art. 15)", "View the personal data Neurow holds about you \u2014 your memories, patterns, connections, and coaching history", "Knowledge Graph view in the app; data export via Settings"],
          ["Correction (GDPR Art. 16)", "Fix any information you believe is inaccurate", "Edit through coaching sessions, Knowledge Graph view, or contact us"],
          ["Deletion (GDPR Art. 17)", "Request complete data removal across all four stores", "Settings > Your Data > Delete; or contact us. See Section 10."],
          ["Portability (GDPR Art. 20)", "Receive your data in machine-readable format; connect another service to your data", "Instant self-service JSON export; MCP interoperability with other AI providers"],
          ["Object (GDPR Art. 21)", "Opt out of specific processing activities", "Opt out of behavioral pattern detection via Settings"],
          ["Restrict processing (GDPR Art. 18)", "Limit how we process your data while a dispute is resolved", "Contact us at privacy@neurow.io"],
          ["Withdraw consent (GDPR Art. 7.3)", "Revoke consent for sensitive data processing at any time", "Settings > Privacy; withdrawal does not affect prior lawful processing"],
          ["Transparency (GDPR Arts. 13\u201314)", "Understand what data we hold, how we process it, and why", "This policy; Knowledge Graph view; contact us"],
          ["Question profiling logic (Minnesota CDPA)", "Understand and question how automated pattern detection works", "Knowledge Graph view shows all detected patterns; coaching conversation can explore any pattern\u2019s basis"],
          ["Lodge complaint (GDPR Art. 77)", "File a complaint with your local data protection authority", "Contact your national supervisory authority or contact us first at privacy@neurow.io"],
        ]}
      />

      <P>
        To exercise any right, use the in-app controls (Settings, Knowledge
        Graph view) or contact <Strong>privacy@neurow.io</Strong>. We respond
        within 30 days as required by GDPR Article 12, though most rights can be
        exercised instantly through the app.
      </P>

      <P>
        <Strong>Request process:</Strong> Upon receiving a privacy request via
        email, we will verify your identity before processing it. We will
        acknowledge receipt within 5 business days and fulfill the request within
        30 days. If we are unable to fulfill a request, we will explain our
        reasons and inform you of your right to lodge a complaint with a
        supervisory authority.
      </P>

      <P>
        <Strong>California residents (CCPA/CPRA):</Strong> Neurow does not sell
        your personal information and does not share it for cross-context
        behavioral advertising. You have the right to know what personal
        information we collect and how it is used (described in Sections 3 and
        4), to delete your data (Section 10), and to not be discriminated against
        for exercising any privacy right. We treat all users equally regardless
        of whether they exercise their privacy rights.
      </P>

      <P>
        <Strong>Texas residents (TDPSA):</Strong> You have the right to access,
        correct, delete, and obtain a portable copy of your personal data, and to
        opt out of the processing of personal data for targeted advertising, the
        sale of personal data, or profiling that produces legal or similarly
        significant effects. Neurow does not engage in targeted advertising, data
        sales, or such profiling.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 10. DELETION AND AGGREGATE DATA                                  */}
      {/* ================================================================ */}
      <SectionHeading id="deletion">
        10. Deletion and Aggregate Data
      </SectionHeading>

      <SubHeading>Individual Deletion &mdash; Hard Delete</SubHeading>

      <P>
        When you request data deletion, your data is removed from all four Brain
        Cloud stores:
      </P>

      <PolicyTable
        headers={["Store", "What\u2019s Deleted", "Mechanism"]}
        rows={[
          ["Supabase (structured)", "Profile, sessions, goals, memories, factual records", "Row deletion with cascade; scoped to your user ID"],
          ["Neo4j (knowledge graph)", "All nodes and relationships belonging to your user account", "Node + relationship deletion by user scope"],
          ["Qdrant (associative)", "All vector embeddings associated with your data", "Point deletion by user filter"],
          ["Mem0 (semantic)", "All natural-language memories for your user ID", "Memory deletion by user scope"],
        ]}
      />

      <P>
        Deletion is completed within 30 days of request. This is hard deletion
        &mdash; not archival, not soft-delete, not &quot;marked inactive.&quot;
        Your data is removed from active storage. Residual copies in automated
        infrastructure backups are overwritten through standard provider rotation
        cycles and are not used for any processing in the interim.
      </P>

      <SubHeading>Aggregate Data</SubHeading>

      <P>
        After your individual data is deleted, Neurow retains anonymized,
        population-level patterns &mdash; statistical observations like
        &quot;70% of users abandon morning routines by week 3.&quot; These are
        business intelligence, not individual data. There is no re-identification
        path from an aggregate statistic back to you.
      </P>

      <P>
        A doctor who has treated 10,000 patients has clinical judgment informed
        by all of them. When one patient leaves, the doctor doesn&apos;t forget
        what they learned about medicine. But they do delete the patient&apos;s
        medical records.
      </P>

      <P>
        Individual data: hard deleted. Gone. Nothing identifiable retained.
        Aggregate patterns: anonymized population learning. GDPR-compliant when
        truly anonymized (Recital 26 &mdash; anonymized data falls outside the
        Regulation&apos;s scope).
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 11. DATA RETENTION                                               */}
      {/* ================================================================ */}
      <SectionHeading id="retention">11. Data Retention</SectionHeading>

      <PolicyTable
        headers={["Data Category", "Retention Period", "Justification"]}
        rows={[
          ["Profile information", "Duration of your account", "Required for coaching service delivery"],
          ["Coaching sessions", "Until you delete them", "Core coaching record; user controls lifecycle"],
          ["Memories and behavioral patterns", "As long as underlying session data exists", "Derived from sessions; deleted when source data is deleted"],
          ["Imported data", "Until you delete it", "User-initiated import; user controls lifecycle"],
          ["Export files", "Generated on-demand; not stored server-side", "Produced at time of request; no server retention"],
          ["Third-party AI processing (Anthropic)", "Up to 30 days for trust and safety", "Provider-governed; not Neurow retention"],
          ["Third-party AI processing (OpenAI)", "Up to 30 days for abuse monitoring", "Provider-governed; not Neurow retention"],
        ]}
      />

      <P>
        <Strong>Principle:</Strong> We do not retain data beyond its stated
        purpose. When you delete the source, we delete the derivatives. When you
        close your account, we delete everything within 30 days.
      </P>

      <P>
        <Strong>Account inactivity:</Strong> If your account has no activity for
        24 consecutive months, we will notify you at your registered email before
        taking any action. If no response is received within 30 days of
        notification, the account and all associated data will be scheduled for
        deletion.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 12. SENSITIVE DATA                                               */}
      {/* ================================================================ */}
      <SectionHeading id="sensitive-data">12. Sensitive Data</SectionHeading>

      <P>
        Coaching conversations may include sensitive personal information &mdash;
        health conditions, financial situations, emotional states, relationship
        dynamics, behavioral patterns related to mental wellbeing. Under GDPR
        Article 9 and multiple US state laws (Maryland defines this category most
        broadly), behavioral and mood data may constitute special category data
        requiring heightened protection.
      </P>

      <P>
        <Strong>Our approach:</Strong>
      </P>

      <BulletList
        items={[
          <><Strong>Explicit consent:</Strong> Processing of sensitive data requires your explicit consent, obtained separately from general terms acceptance during onboarding. This consent is specific (names the processing activities), informed (explains what will happen), freely given (you may decline or withdraw sensitive data consent without losing access to core coaching functionality), and withdrawable (at any time via Settings).</>,
          <><Strong>Purpose limitation:</Strong> Sensitive data is used exclusively for coaching delivery and behavioral pattern recognition within your personal Brain Cloud. No secondary use.</>,
          <><Strong>No cross-purpose use:</Strong> Sensitive data is never used for advertising, profiling for third parties, or any purpose beyond your personal coaching.</>,
          <><Strong>Behavioral analysis, not emotion recognition:</Strong> We analyze patterns in self-reported data &mdash; what you tell us about how you feel, what you&apos;re working on, what&apos;s difficult. We do not perform emotion recognition from biometric data. This distinction matters under the EU AI Act, where emotion recognition from biometric data triggers prohibited or high-risk classification. Self-reported behavioral data does not.</>,
        ]}
      />

      <Divider />

      {/* ================================================================ */}
      {/* 13. SECURITY ARCHITECTURE                                        */}
      {/* ================================================================ */}
      <SectionHeading id="security">13. Security Architecture</SectionHeading>

      <SubHeading>Encryption</SubHeading>

      <BulletList
        items={[
          <><Strong>In transit:</Strong> TLS 1.2+ for all data transmission between your device, Brain Cloud stores, and third-party AI providers</>,
          <><Strong>At rest:</Strong> AES-256 encryption across all four Brain Cloud stores &mdash; Supabase (PostgreSQL-level encryption managed by AWS), Neo4j Aura (encrypted at rest by infrastructure provider), Qdrant Cloud (encrypted at rest by infrastructure provider), and Mem0 (encrypted at rest by infrastructure provider)</>,
          <><Strong>Key management:</Strong> Encryption keys are managed by our infrastructure providers with automatic rotation</>,
        ]}
      />

      <SubHeading>User Data Isolation</SubHeading>

      <BulletList
        items={[
          <><Strong>Per-user scoping across all stores:</Strong> Every query across all four Brain Cloud stores is scoped to the requesting user&apos;s ID. Supabase, Neo4j, Qdrant, and Mem0 each enforce their own user-scoped access boundary at the application level. No code path exists to return data belonging to a different user.</>,
          <><Strong>Defense in depth:</Strong> Our security architecture is designed in layers &mdash; application-level user scoping as the primary isolation boundary, with database-level Row-Level Security (RLS) in PostgreSQL providing an additional enforcement layer independent of application logic.</>,
          <><Strong>No cross-account access:</Strong> There is no mechanism &mdash; by design &mdash; for one user&apos;s session to access another user&apos;s Brain Cloud data.</>,
        ]}
      />

      <SubHeading>Architecture</SubHeading>

      <BulletList
        items={[
          <><Strong>Four independent stores</Strong> with separate access controls, separate authentication, and separate failure domains. A compromise of one store does not automatically grant access to the others.</>,
          <><Strong>No bulk data exposure:</Strong> Brain Cloud data is retrieved per-query based on the active coaching context. No endpoint exposes a user&apos;s complete data store in a single request (the export tool is the deliberate exception, authenticated and user-initiated).</>,
        ]}
      />

      <SubHeading>International Data Transfers</SubHeading>

      <P>
        Brain Cloud infrastructure is hosted on cloud services based in the
        United States. If you access Neurow from outside the US, your data will
        be transferred to and processed in the US. For EEA users, these
        transfers are governed by Standard Contractual Clauses (SCCs) as
        implemented by our infrastructure providers.
      </P>

      <SubHeading>Breach Notification</SubHeading>

      <P>
        In the event of a security breach involving your personal data, we will
        notify you within 60 days as required by the FTC Health Breach
        Notification Rule and applicable state breach notification laws.
        Notification will include: the nature of the breach, the categories of
        data affected, and the steps we are taking in response. Where required
        by law, we will also notify the relevant regulatory authorities.
      </P>

      <SubHeading>Export Security</SubHeading>

      <P>
        The data export function is a privileged operation. Security
        considerations:
      </P>

      <BulletList
        items={[
          "Export is user-initiated only (no automated bulk export)",
          "Authenticated to the requesting user\u2019s session",
          "Scoped to the requesting user\u2019s data",
          "Export files are generated on-demand and delivered directly to the user\u2019s device \u2014 not stored server-side",
        ]}
      />

      <Divider />

      {/* ================================================================ */}
      {/* 14. DTI ALIGNMENT                                                */}
      {/* ================================================================ */}
      <SectionHeading id="dti">14. DTI Alignment</SectionHeading>

      <P>
        Neurow is DTI-aligned across all five of the Data Transfer
        Initiative&apos;s AI Transfer Principles:
      </P>

      <PolicyTable
        headers={["#", "Principle", "Our Implementation"]}
        rows={[
          ["1", "Download & Transfer \u2014 Users can download personal data and request direct transfer between services", "Instant JSON export to your device (Settings > Your Data) + MCP protocol for direct AI-to-Brain-Cloud connection (interoperability without data migration) + DTP format compatibility for imports"],
          ["2", "Machine-Readable Format \u2014 Data provided in structured, well-documented format", "Structured JSON with documented schema; memories, coaching sessions, behavioral insights, and profile data"],
          ["3", "Scope: User Data Only \u2014 Personal data including customization data is portable; training data and methodology are not", "All three DTI data categories (Input, Output, Observed) fully portable. Derived Data also portable \u2014 exceeding DTI\u2019s baseline. Coaching methodology and graph architecture excluded."],
          ["4", "Open Technical Standards \u2014 Portability via open, interoperable specifications", "MCP (Model Context Protocol \u2014 open agent-to-agent interoperability for live connection) + DTP (Data Transfer Project \u2014 open data format for imports)"],
          ["5", "Security Vetting \u2014 Documented privacy policy, security practices, authentication, access controls", "This policy; AES-256 encryption; per-user data isolation across all four stores; authenticated export"],
        ]}
      />

      <P>
        <Strong>DTI 5 Transfer Principles: 5/5 implemented.</Strong> Not
        retrofitted &mdash; structural. The architecture was designed around
        portability from day one.
      </P>

      <P>
        <Strong>Language note:</Strong> We say &quot;DTI-aligned,&quot; not
        &quot;DTI-compliant.&quot; No formal DTI certification program exists.
        Our alignment is architectural and verifiable in our codebase.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 15. AUTOMATED DECISION-MAKING                                    */}
      {/* ================================================================ */}
      <SectionHeading id="profiling">
        15. Automated Decision-Making and Profiling
      </SectionHeading>

      <P>
        GDPR Article 22 governs automated decision-making that produces legal or
        similarly significant effects. Neurow does not engage in such processing
        &mdash; our advisory architecture (Design Principle #1) means coaching
        insights inform your thinking without making decisions on your behalf. We
        disclose our approach to automated profiling below for transparency, and
        because 12 US states (including Texas, Colorado, and California) require
        plain-language explanation of profiling activities.
      </P>

      <P>
        <Strong>How pattern detection works (plain language):</Strong> Neurow
        uses AI to identify patterns in your coaching data. For example, it
        might recognize that you tend to avoid financial conversations when
        stressed, that your most productive periods follow consistent morning
        routines, or that discretionary spending increases in the week after
        high-stress calendar periods. These patterns are surfaced as coaching
        observations to help you understand yourself better.
      </P>

      <P>
        <Strong>No consequential automated decisions:</Strong> Neurow advises.
        You decide. There is no automated approval, denial, scoring, ranking, or
        determination that affects your rights, opportunities, or access to
        services. This is not merely a policy &mdash; it is an architectural
        constraint.
      </P>

      <P>
        <Strong>Your control:</Strong>
      </P>

      <BulletList
        items={[
          "View all detected patterns and inferences in the Knowledge Graph view",
          "Question the basis of any pattern through coaching conversation",
          "Request correction or deletion of any pattern you believe is inaccurate",
          "Opt out of behavioral pattern detection entirely via Settings",
        ]}
      />

      <Divider />

      {/* ================================================================ */}
      {/* 16. DPIA                                                         */}
      {/* ================================================================ */}
      <SectionHeading id="dpia">
        16. Data Protection Impact Assessment
      </SectionHeading>

      <P>
        Given the sensitive nature of coaching data and behavioral pattern
        processing, a formal Data Protection Impact Assessment will be completed
        prior to production launch, as contemplated by GDPR Article 35 for
        high-risk processing and recommended by 18 of 20 US state privacy laws
        that address profiling. Our preliminary assessment identifies the
        following areas of focus:
      </P>

      <BulletList
        items={[
          "The necessity and proportionality of behavioral pattern processing for coaching delivery",
          "Risks to data subjects from inference generation",
          "Safeguards: user transparency (Knowledge Graph view), hard deletion across all stores, granular consent mechanisms, advisory architecture",
          "Third-party AI processing data flows, retention policies, and scope limitations",
        ]}
      />

      <P>
        Neurow maintains records of its data processing activities as
        contemplated by GDPR Article 30, including the purposes of processing,
        categories of data subjects, categories of personal data, and retention
        timelines.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 17. CHILDREN                                                     */}
      {/* ================================================================ */}
      <SectionHeading id="children">17. Children</SectionHeading>

      <P>
        Neurow is designed for adults. You must be 18 years or older to use
        Neurow. We do not knowingly collect data from anyone under 18. Age
        verification is self-reported during onboarding, consistent with
        industry practice for non-child-directed services. If we learn that we
        have collected data from a minor, we will delete it promptly.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 18. CHANGES TO THIS POLICY                                       */}
      {/* ================================================================ */}
      <SectionHeading id="changes">18. Changes to This Policy</SectionHeading>

      <P>
        We will notify you directly of any material changes to this policy
        before they take effect. We do not quietly adopt more permissive data
        practices.
      </P>

      <P>
        If we ever change our position on AI training, data sharing, retention,
        or the scope of data portability, you will be informed explicitly and
        asked for fresh consent before any change takes effect.
      </P>

      <P>
        <Strong>Effective date:</Strong> March 9, 2026
        <br />
        <Strong>Last updated:</Strong> March 8, 2026
        <br />
        <Strong>Review cadence:</Strong> This policy is reviewed quarterly and
        updated as necessary.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 19. CONTACT                                                      */}
      {/* ================================================================ */}
      <SectionHeading id="contact">19. Contact</SectionHeading>

      <P>
        <Strong>Neurow, Inc.</Strong>
        <br />
        Austin, TX, United States
      </P>

      <P>
        For privacy questions, data access requests, deletion requests, or to
        exercise any right described in this policy, contact our Privacy Lead:
        {" "}<Strong>privacy@neurow.io</Strong>
      </P>

      <P>
        <Strong>Governing law:</Strong> This policy is governed by the laws of
        the State of Texas, United States, without regard to conflict of law
        principles. For EEA residents, nothing in this policy limits your rights
        under applicable EU data protection law.
      </P>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-[#E6E5E3]">
        <p className="text-xs text-muted-foreground leading-relaxed">
          DTI-aligned across all five AI Transfer Principles. Designed to
          address GDPR Articles 6, 7, 9, 12&ndash;18, 20&ndash;22, 35, and 77.
          Informed by International Coaching Federation 2025 confidentiality
          standards. Designed for the EU AI Act (Article 50, effective August 2,
          2026), Colorado SB 205 (effective June 30, 2026), Maryland MODPA
          (effective April 1, 2026), and the emerging US state privacy
          landscape.
        </p>
      </div>
    </div>
  );
}
