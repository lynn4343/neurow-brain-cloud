"use client";

// ---------------------------------------------------------------------------
// PrivacyPolicyContent — Full Neurow Privacy Policy (v2.1)
//
// Renders the complete 19-section privacy policy as React components.
// Source: Data_Privacy_Legal/Draft_Privacy_Policy.md
// Governing decision: BD-001 — "Full Access, Curated Format"
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
          Effective March 9, 2026 &middot; Last updated March 6, 2026
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
          Your memories, coaching sessions, behavioral patterns, and knowledge
          graph belong to you. You can inspect, export, transfer, or delete them
          at any time. What remains ours is how we help you: the coaching
          methodology, the algorithms, the ontology &mdash; the equivalent of a
          therapist&apos;s clinical training, not their patient&apos;s records.
        </p>
      </Callout>

      <P>
        Our architecture is designed to satisfy the requirements of GDPR, CCPA,
        the Texas Data Privacy and Security Act, and the emerging provisions of
        the EU AI Act &mdash; but compliance is our floor, not our ceiling. Where
        the law is silent, we default to the position that gives you more
        control, not less.
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
          <><Strong>Advisory, not directive.</Strong> Neurow coaches. You decide. We surface patterns and insights to inform your thinking. We never make decisions that produce legal, financial, or similarly significant effects on your behalf.</>,
          <><Strong>Behavioral analysis, not emotion recognition.</Strong> We analyze self-reported data and behavioral patterns you share in coaching sessions. We do not perform biometric emotion detection, sentiment analysis from facial expressions, or any form of emotion recognition from physiological data.</>,
          <><Strong>Explicit consent for sensitive data.</Strong> Behavioral patterns, emotional states, and health information shared in coaching sessions receive their own consent &mdash; separate from general terms, specific in purpose, and withdrawable at any time.</>,
          <><Strong>AI disclosure at first interaction.</Strong> Neurow is an AI coaching system. You are interacting with artificial intelligence, not a human coach.</>,
          <><Strong>No third-party sharing.</Strong> Your data stays in your Brain Cloud. It is not sold, not shared for advertising, not provided to data brokers, and not used for cross-account analysis.</>,
          <><Strong>Deletion means deletion.</Strong> When you delete your data, it is removed from all four Brain Cloud stores. Not archived. Not soft-deleted. Not retained for model training. Gone.</>,
          <><Strong>Probabilistic, not deterministic.</Strong> Coaching insights are framed as patterns and observations &mdash; never as diagnoses, certainties, or clinical assessments.</>,
          <><Strong>Designed for future regulation.</Strong> We build for 2028 law, not 2026 law. Being ahead of regulation is better for you.</>,
        ]}
      />

      <Divider />

      {/* ================================================================ */}
      {/* 2. WHAT YOU OWN AND WHAT WE KEEP                                 */}
      {/* ================================================================ */}
      <SectionHeading id="ownership">
        2. What You Own and What We Keep
      </SectionHeading>

      <SubHeading>What&apos;s Yours &mdash; Full Access, Export, Delete, Transfer</SubHeading>

      <PolicyTable
        headers={["Category", "Examples", "Your Rights"]}
        rows={[
          [
            "Input Data",
            "Everything you type, say, or import \u2014 coaching conversations, goals, plans, reflections, notes, calendar entries, imported data",
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
            "Behavioral patterns from your coaching history, knowledge graph connections, coaching insights, progress tracking \u2014 generated by our processing",
            "Full access, download, delete, transfer",
          ],
        ]}
      />

      <P>
        The first three categories follow the Data Transfer Initiative&apos;s
        framework for AI personal data. The fourth &mdash; Derived Data &mdash;
        is where we go further. Under GDPR Article 20, derived data is the
        controller&apos;s work product and is not required to be portable.{" "}
        <Strong>We export it anyway.</Strong> Behavioral patterns identified from
        your coaching history are derived from your life. We believe they belong
        to you, regardless of what current regulation requires.
      </P>

      <SubHeading>What&apos;s Ours &mdash; Coaching Methodology and System Architecture</SubHeading>

      <PolicyTable
        headers={["Category", "Examples", "Why It\u2019s Ours"]}
        rows={[
          [
            "Coaching methodology",
            "Session protocols, question frameworks, intervention timing, behavioral science models",
            "Professional expertise \u2014 the engine that selects and times coaching",
          ],
          [
            "Processing intelligence",
            "Signal detection algorithms, scoring models, graph ontology design, parsing pipelines",
            "Engineering \u2014 how we transform raw data into intelligence",
          ],
          [
            "Aggregate patterns",
            "Anonymized, population-level behavioral insights",
            "Research layer \u2014 no individual data, no re-identification path",
          ],
          [
            "Schema architecture",
            "Data models, relationship structures, classification systems, prompt templates",
            "Infrastructure design \u2014 how we organize, not what we organize",
          ],
        ]}
      />

      <SubHeading>The Gray Area &mdash; Made Tangible</SubHeading>

      <BulletList
        items={[
          <><Strong>&quot;You tend to abandon goals on Wednesdays&quot;</Strong> &mdash; this is yours. A specific observation about your behavior, derived from your data. You can see it, export it, correct it, or delete it.</>,
          <><Strong>The algorithm that detected the Wednesday pattern</Strong> &mdash; this is ours. Coaching intelligence that analyzes behavioral sequences. It exists independently of any individual user&apos;s data.</>,
          <><Strong>&quot;Your energy drops after weeks without exercise&quot;</Strong> &mdash; yours. A behavioral pattern from your coaching history.</>,
          <><Strong>The scoring model that prioritizes which patterns to surface</Strong> &mdash; ours. Professional methodology.</>,
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
          "Data you import from other AI providers or files",
        ]}
      />

      <P>
        <Strong>Legal basis:</Strong> Contract performance &mdash; processing
        this data is necessary to deliver the coaching service you signed up for
        (GDPR Article 6.1(b)).
      </P>

      <SubHeading>Data Generated During Your Use</SubHeading>

      <BulletList
        items={[
          <><Strong>Output Data:</Strong> AI-generated coaching responses, session summaries, and morning briefs</>,
          <><Strong>Observed Data:</Strong> Session frequency, engagement timing, and feature usage patterns</>,
          <><Strong>Derived Data:</Strong> Behavioral patterns, knowledge graph connections, coaching insights, and progress tracking</>,
        ]}
      />

      <P>
        <Strong>Legal basis:</Strong> Behavioral pattern processing and
        knowledge graph construction may constitute sensitive personal data under
        GDPR Article 9. Processing requires your{" "}
        <Strong>explicit consent</Strong>, obtained separately from general terms
        acceptance (GDPR Article 9.2(a)). You may withdraw this consent at any
        time through Settings.
      </P>

      <SubHeading>Data We Do Not Collect</SubHeading>

      <BulletList
        items={[
          "Location or GPS data",
          "Biometric data (facial recognition, voice prints, physiological signals)",
          "Browsing history or device fingerprints",
          "Data from other users or cross-account information",
          "Any data for behavioral advertising purposes",
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
          ["Coaching delivery", "Generating personalized coaching responses informed by your history", "Contract (Art. 6.1(b))"],
          ["Pattern recognition", "Identifying behavioral patterns across sessions to surface insights", "Explicit consent (Art. 9.2(a))"],
          ["Knowledge graph construction", "Connecting your information into a structured graph for contextual coaching", "Contract (Art. 6.1(b)); Consent (Art. 9.2(a)) for sensitive categories"],
          ["Progress tracking", "Measuring behavioral change over time", "Explicit consent (Art. 9.2(a))"],
        ]}
      />

      <P>
        <Strong>We do NOT use your data for:</Strong> training AI models,
        targeted advertising, profiling for third parties, sale to data brokers,
        cross-account analysis, or making automated decisions that produce legal
        or similarly significant effects concerning you.
      </P>

      <P>
        <Strong>Advisory architecture:</Strong> Neurow surfaces patterns and
        observations. It does not make consequential decisions on your behalf. If
        Neurow identifies that your spending increases during high-stress
        periods, it raises this as a coaching observation. It will not freeze
        your credit card, notify your employer, or take any action beyond the
        coaching conversation. This is architecturally enforced.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 5. THIRD-PARTY AI PROCESSING                                     */}
      {/* ================================================================ */}
      <SectionHeading id="third-party">
        5. Third-Party AI Processing
      </SectionHeading>

      <P>
        Neurow uses third-party AI models to generate coaching responses. Here is
        exactly what happens:
      </P>

      <SubHeading>Default Configuration</SubHeading>

      <BulletList
        items={[
          <><Strong>Provider:</Strong> Anthropic (Claude), accessed via their commercial API tier</>,
          <><Strong>What they receive:</Strong> The content of your active coaching conversation, plus relevant context from your Brain Cloud for that session</>,
          <><Strong>What they do NOT receive:</Strong> Your full Brain Cloud memory store, your complete knowledge graph, behavioral patterns from other sessions, or data from other users</>,
          <><Strong>Their retention:</Strong> Anthropic&apos;s commercial API tier does not use inputs or outputs to train models. Conversation data is retained for up to 30 days for trust and safety purposes per their published data handling policies.</>,
        ]}
      />

      <SubHeading>Bring Your Own Key (BYOK)</SubHeading>

      <P>
        When you configure your own API key (Settings &gt; Model Configuration),
        you establish a direct relationship with your chosen provider for AI
        processing. Neurow remains the data controller (we determine the purpose
        and means of processing your Brain Cloud data), but your chosen provider
        processes conversation data under your API agreement with them. We
        support Anthropic, OpenAI, NVIDIA, and custom OpenAI-compatible
        endpoints.
      </P>

      <SubHeading>What Stays in Your Brain Cloud</SubHeading>

      <P>
        Your knowledge graph, long-term memories, behavioral patterns, and
        session history are stored in your Brain Cloud instance. They are not
        transmitted to AI providers in bulk &mdash; only the specific context
        needed for an active coaching conversation is sent.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 6. YOUR BRAIN CLOUD                                              */}
      {/* ================================================================ */}
      <SectionHeading id="brain-cloud">6. Your Brain Cloud</SectionHeading>

      <P>
        Brain Cloud is your personal knowledge graph &mdash; the structured
        memory system that powers your coaching experience. It stores your data
        across four specialized systems, each serving a distinct cognitive
        function:
      </P>

      <BulletList
        items={[
          <><Strong>Structured storage</Strong> &mdash; your profile, session records, goals, factual data, and structured metadata</>,
          <><Strong>Knowledge graph</Strong> &mdash; relationships between your information: how goals connect to behaviors, how patterns relate to outcomes</>,
          <><Strong>Semantic memory</Strong> &mdash; natural-language memories and contextual understanding for coaching conversations</>,
          <><Strong>Associative memory</Strong> &mdash; similarity-based connections that surface relevant past experiences</>,
        ]}
      />

      <P>
        <Strong>You can inspect your entire Brain Cloud</Strong> at any time
        through the Knowledge Graph view in the app. Every node, every
        connection, every inference &mdash; visible, transparent, and under your
        control.
      </P>

      <P>
        <Strong>You own everything in your Brain Cloud.</Strong> This includes
        data you entered directly AND insights generated from your data.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 7. AI TRAINING                                                   */}
      {/* ================================================================ */}
      <SectionHeading id="ai-training">7. AI Training</SectionHeading>

      <Callout>
        <p className="text-sm font-medium text-[#1E1E1E]">
          Neurow does not use your personal data to train or improve AI models.
          This commitment is permanent and unconditional.
        </p>
      </Callout>

      <BulletList
        items={[
          "We do not train on your data by default.",
          "We do not offer an opt-in to training on your data.",
          "We do not share your data with third parties for training purposes.",
          "This commitment will not change without your explicit, informed consent. Any future change would require direct notification and affirmative opt-in.",
        ]}
      />

      <P>
        This is a stronger commitment than most AI services, which train on user
        data by default with an opt-out mechanism. Your coaching data is too
        personal for that approach.
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
        You can download your complete Brain Cloud data at any time (Settings
        &gt; Your Data &gt; Export). The export is provided in structured,
        machine-readable JSON with a documented schema. Per GDPR Article 20, you
        have the right to receive your personal data &quot;in a structured,
        commonly used and machine-readable format&quot; and to &quot;transmit
        that data to another controller without hindrance.&quot;
      </P>

      <P>
        <Strong>What you receive:</Strong> all memories and notes, complete
        coaching session history, behavioral patterns and insights, goals and
        progress records, and your full knowledge graph &mdash; nodes AND
        relationships.
      </P>

      <P>
        We don&apos;t dump the database. We transform your data into something
        meaningful &mdash; human-readable context with the graph structure
        preserved. You get the cake, not the flour.
      </P>

      <SubHeading>Direct Transfer &mdash; Two Open Protocols</SubHeading>

      <P>
        Brain Cloud speaks two open portability protocols:
      </P>

      <NumberedList
        items={[
          <><Strong>MCP (Model Context Protocol)</Strong> &mdash; Anthropic&apos;s open agent-to-agent interoperability standard. Any MCP-compatible AI service can connect directly to your Brain Cloud. This is how Neurow itself connects.</>,
          <><Strong>DTP (Data Transfer Project)</Strong> &mdash; The Data Transfer Initiative&apos;s open data format standard, powering Google Takeout and other major data portability tools. Brain Cloud accepts DTP-formatted imports and can export in DTP-compatible formats.</>,
        ]}
      />

      <P>
        Two open protocols. Two independent paths to move your data. No
        proprietary lock-in.
      </P>

      <SubHeading>Exceeds the Standard</SubHeading>

      <P>
        GDPR Article 20 requires portability of Input Data and Observed Data. It
        does not require portability of Derived Data &mdash; behavioral patterns
        and inferences generated through our processing.{" "}
        <Strong>We export Derived Data anyway.</Strong> We believe that insights
        derived from your life belong to you regardless of what current
        regulation requires. We don&apos;t just meet the standard. We exceed it.
      </P>

      <P>
        <Strong>Response time:</Strong> GDPR Article 12 requires response within
        30 days. In practice, our export tool is instant and self-service.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 9. YOUR RIGHTS                                                   */}
      {/* ================================================================ */}
      <SectionHeading id="rights">9. Your Rights</SectionHeading>

      <PolicyTable
        headers={["Right", "What It Means", "How to Exercise"]}
        rows={[
          ["Access (GDPR Art. 15)", "View everything Neurow knows about you", "Knowledge Graph view; full export via Settings"],
          ["Correction (GDPR Art. 16)", "Fix any inaccurate information", "Edit through coaching sessions or contact us"],
          ["Deletion (GDPR Art. 17)", "Complete data removal across all four stores", "Settings > Your Data > Delete; or contact us"],
          ["Portability (GDPR Art. 20)", "Receive data in machine-readable format; transfer to another service", "Instant self-service JSON export; direct transfer via MCP or DTP"],
          ["Object (GDPR Art. 21)", "Opt out of specific processing activities", "Opt out of behavioral pattern detection via Settings"],
          ["Restrict processing (GDPR Art. 18)", "Limit processing while a dispute is resolved", "Contact us at privacy@neurow.io"],
          ["Withdraw consent (GDPR Art. 7.3)", "Revoke consent for sensitive data processing", "Settings > Privacy; does not affect prior lawful processing"],
          ["Transparency (GDPR Arts. 13\u201314)", "Understand what data we hold and why", "This policy; Knowledge Graph view; contact us"],
          ["Question profiling logic", "Understand how automated pattern detection works", "Knowledge Graph view; coaching conversation can explore any pattern"],
          ["Lodge complaint (GDPR Art. 77)", "File a complaint with your local data protection authority", "Contact your national supervisory authority or reach us at privacy@neurow.io"],
        ]}
      />

      <P>
        To exercise any right, use the in-app controls (Settings, Knowledge
        Graph view) or contact <Strong>privacy@neurow.io</Strong>. We respond
        within 30 days, though most rights can be exercised instantly through the
        app.
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
          ["Structured storage", "Profile, sessions, goals, factual records", "Row deletion with cascade; Row-Level Security ensures scope"],
          ["Knowledge graph", "All nodes and relationships for your account", "Node + relationship deletion by user scope"],
          ["Associative memory", "All vector embeddings associated with your data", "Point deletion by user filter"],
          ["Semantic memory", "All natural-language memories for your user ID", "Memory deletion by user scope"],
        ]}
      />

      <P>
        Deletion is completed within 30 days of request. This is hard deletion
        &mdash; not archival, not soft-delete. Residual copies in automated
        infrastructure backups are overwritten within 30 days through standard
        rotation cycles and are not used for any processing in the interim.
      </P>

      <SubHeading>Aggregate Data</SubHeading>

      <P>
        After individual deletion, Neurow retains anonymized, population-level
        patterns &mdash; statistical observations like &quot;70% of users abandon
        morning routines by week 3.&quot; These are business intelligence, not
        individual data. There is no re-identification path from an aggregate
        statistic back to you.
      </P>

      <P>
        A doctor who has treated 10,000 patients has clinical judgment informed
        by all of them. When one patient leaves, the doctor doesn&apos;t forget
        what they learned about medicine. But they do delete the patient&apos;s
        medical records.
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
          ["Behavioral patterns", "As long as underlying session data exists", "Derived from sessions; deleted when source data is deleted"],
          ["Knowledge graph", "Until you delete or request full deletion", "Structural connections; user controls lifecycle"],
          ["Imported data", "Until you delete it", "User-initiated import; user controls lifecycle"],
          ["Export files", "Generated on-demand; not stored server-side", "Produced at time of request; no server retention"],
          ["Third-party AI processing", "Per provider policy (Anthropic: up to 30 days)", "Provider-governed; not Neurow retention"],
        ]}
      />

      <P>
        We do not retain data beyond its stated purpose. When you delete the
        source, we delete the derivatives. When you close your account, we
        delete everything within 30 days.
      </P>

      <P>
        <Strong>Account inactivity:</Strong> If your account has no activity for
        24 consecutive months, we will notify you at your registered email before
        taking any action. If no response is received within 30 days, the
        account and all associated data will be scheduled for deletion.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 12. SENSITIVE DATA                                               */}
      {/* ================================================================ */}
      <SectionHeading id="sensitive-data">12. Sensitive Data</SectionHeading>

      <P>
        Coaching conversations may include sensitive personal information &mdash;
        health conditions, financial situations, emotional states, relationship
        dynamics. Under GDPR Article 9 and multiple US state laws, behavioral
        and mood data may constitute special category data requiring heightened
        protection.
      </P>

      <BulletList
        items={[
          <><Strong>Explicit consent:</Strong> Processing of sensitive data requires your explicit consent, obtained separately during onboarding. This consent is specific, informed, freely given (the core coaching service functions without it &mdash; you can use Neurow for goal-setting, task management, and general coaching without behavioral pattern processing), and withdrawable at any time via Settings.</>,
          <><Strong>Purpose limitation:</Strong> Sensitive data is used exclusively for coaching delivery and behavioral pattern recognition within your personal Brain Cloud.</>,
          <><Strong>No cross-purpose use:</Strong> Sensitive data is never used for advertising, profiling for third parties, or any purpose beyond your personal coaching.</>,
          <><Strong>Behavioral analysis, not emotion recognition:</Strong> We analyze patterns in self-reported data &mdash; what you tell us. We do not perform emotion recognition from biometric data. This distinction matters under the EU AI Act, where biometric emotion recognition triggers prohibited or high-risk classification.</>,
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
          <><Strong>At rest:</Strong> AES-256 encryption across all four Brain Cloud stores, managed by each provider&apos;s infrastructure with automatic key management</>,
        ]}
      />

      <SubHeading>User Data Isolation</SubHeading>

      <BulletList
        items={[
          <><Strong>Row-Level Security (RLS):</Strong> Data isolation is enforced at the database level through PostgreSQL Row-Level Security policies. Every query is scoped to the authenticated user&apos;s ID. Even a compromised API endpoint cannot return another user&apos;s data.</>,
          <><Strong>Per-user scoping across all stores:</Strong> All four stores filter by user ID. Each store enforces its own access boundary.</>,
          <><Strong>No cross-account access:</Strong> There is no mechanism &mdash; by design &mdash; for one user&apos;s session to access another user&apos;s Brain Cloud data.</>,
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

      <SubHeading>Export API Security</SubHeading>

      <BulletList
        items={[
          "Export is user-initiated only (no automated bulk export)",
          "Authenticated to the requesting user\u2019s session",
          "Scoped by RLS to the authenticated user\u2019s data only",
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
          ["1", "Download & Transfer", "brain_export (instant JSON download) + MCP protocol (direct transfer) + DTP format compatibility"],
          ["2", "Machine-Readable Format", "Structured JSON with documented schema; knowledge graph exported with nodes AND relationships"],
          ["3", "Scope: User Data Only", "All DTI categories (Input, Output, Observed) portable. Derived Data also portable \u2014 exceeding baseline. Coaching methodology excluded."],
          ["4", "Open Technical Standards", "Two open protocols: MCP (agent-to-agent) + DTP (data format interoperability)"],
          ["5", "Security Vetting", "This policy; AES-256 encryption; Row-Level Security; per-user scoping; authenticated export"],
        ]}
      />

      <P>
        <Strong>DTI 5 Transfer Principles: 5/5 implemented.</Strong> Not
        retrofitted &mdash; structural. The architecture was designed around
        portability from day one.
      </P>

      <P>
        We say &quot;DTI-aligned,&quot; not &quot;DTI-compliant.&quot; No formal
        DTI certification program exists. Our alignment is architectural and
        verifiable in our codebase.
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
        &mdash; our advisory architecture means coaching insights inform your
        thinking without making decisions on your behalf. We disclose our
        approach to automated profiling for transparency, and because 12 US
        states require plain-language explanation of profiling activities.
      </P>

      <P>
        <Strong>How pattern detection works:</Strong> Neurow uses AI to identify
        patterns in your coaching data. For example, it might recognize that you
        tend to avoid financial conversations when stressed, or that your most
        productive periods follow consistent morning routines.
      </P>

      <P>
        <Strong>Your control:</Strong> View all detected patterns in the
        Knowledge Graph view. Question the basis of any pattern through coaching
        conversation. Request correction or deletion. Opt out of behavioral
        pattern detection entirely via Settings.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 16. DPIA                                                         */}
      {/* ================================================================ */}
      <SectionHeading id="dpia">
        16. Data Protection Impact Assessment
      </SectionHeading>

      <P>
        Given the sensitive nature of coaching data and behavioral pattern
        processing, we have assessed the data protection impact of our
        processing activities as contemplated by GDPR Article 35 for high-risk
        processing. A formal, documented DPIA will be completed prior to
        production launch. Our assessment covers the necessity and
        proportionality of behavioral pattern processing, risks to data subjects
        from inference generation, and safeguards including user transparency,
        hard deletion, granular consent, and advisory architecture.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 17. CHILDREN                                                     */}
      {/* ================================================================ */}
      <SectionHeading id="children">17. Children</SectionHeading>

      <P>
        Neurow is designed for adults. You must be 18 years or older to use
        Neurow. We do not knowingly collect data from anyone under 18. If we
        learn that we have collected data from a minor, we will delete it
        promptly.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 18. CHANGES TO THIS POLICY                                       */}
      {/* ================================================================ */}
      <SectionHeading id="changes">18. Changes to This Policy</SectionHeading>

      <P>
        We will notify you directly of any material changes to this policy
        before they take effect. We will never quietly adopt more permissive data
        practices. If we ever change our position on AI training, data sharing,
        retention, or the scope of data portability, you will be informed
        explicitly and asked for fresh consent.
      </P>

      <Divider />

      {/* ================================================================ */}
      {/* 19. CONTACT                                                      */}
      {/* ================================================================ */}
      <SectionHeading id="contact">19. Contact</SectionHeading>

      <P>
        <Strong>Neurow, Inc.</Strong>
        <br />
        Austin, TX
      </P>

      <P>
        For privacy questions, data access requests, deletion requests, or to
        exercise any right described in this policy:{" "}
        <Strong>privacy@neurow.io</Strong>
      </P>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-[#E6E5E3]">
        <p className="text-xs text-muted-foreground leading-relaxed">
          DTI-aligned across all five AI Transfer Principles. Designed to
          satisfy GDPR Articles 6, 7, 9, 12&ndash;18, 20&ndash;22, 35, and 77.
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
