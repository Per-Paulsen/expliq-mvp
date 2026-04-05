"use client";

import { useState } from "react";
import { Bot, ArrowRight, Sparkles, AlertTriangle, TrendingUp, Activity, Zap, ChevronRight } from "lucide-react";

// ============================================================
// DESIGN SPIKE — DEMO PAGE
// This page is a prototype for testing visual design patterns.
// It is NOT part of the real app — it will be removed after
// the design direction is finalized.
// ============================================================

// --- Font loader (we load all 3 to compare) ---
// Fonts are loaded via <link> tags in the head below

type FontOption = "jakarta" | "outfit" | "manrope";
type ThemeOption = "light-warm" | "light-cool" | "light-gray";

const fontClasses: Record<FontOption, string> = {
  jakarta: "font-[family-name:'Plus_Jakarta_Sans']",
  outfit: "font-[family-name:'Outfit']",
  manrope: "font-[family-name:'Manrope']",
};

const themeColors: Record<ThemeOption, { bg: string; card: string; border: string; shadow: string }> = {
  "light-warm": { bg: "bg-[#faf9f7]", card: "bg-white", border: "border-[#e8e5e0]", shadow: "shadow-sm" },
  "light-cool": { bg: "bg-[#f0f4f8]", card: "bg-white", border: "border-[#dce3ed]", shadow: "shadow-sm" },
  "light-gray": { bg: "bg-[#f5f5f7]", card: "bg-white", border: "border-[#e5e7eb]", shadow: "shadow-sm" },
};

export default function DesignSpikePage() {
  const [font, setFont] = useState<FontOption>("jakarta");
  const [theme, setTheme] = useState<ThemeOption>("light-gray");

  const t = themeColors[theme];
  const fc = fontClasses[font];

  return (
    <>
      {/* Load Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className={`${fc} ${t.bg} -m-6 p-8 min-h-screen`}>
        {/* Controls */}
        <div className="mb-8 flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Font</span>
            <div className="flex gap-2">
              {(["jakarta", "outfit", "manrope"] as FontOption[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFont(f)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    font === f ? "bg-[#0d9488] text-white" : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {f === "jakarta" ? "Plus Jakarta Sans" : f === "outfit" ? "Outfit" : "Manrope"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Background</span>
            <div className="flex gap-2">
              {(["light-warm", "light-cool", "light-gray"] as ThemeOption[]).map((th) => (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    theme === th ? "bg-[#0d9488] text-white" : "bg-white text-gray-700 border border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {th}
                </button>
              ))}
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Design Spike — Component Prototypes</h1>
        <p className="text-base text-gray-500 mb-10">Testing card patterns, fonts, and layout for Expliq dashboard</p>

        {/* ============================================ */}
        {/* 1. KPI CARDS */}
        {/* ============================================ */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">1. KPI Cards</h2>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Workflows" value="12" delta="+2 since last sync" deltaType="positive" />
            <KpiCard label="Processes" value="4" delta="Across 14 systems" deltaType="neutral" />
            <KpiCard label="Active" value="7" delta="of 12 total" deltaType="neutral" />
            <KpiCard label="Time Saved" value="~12 hrs/wk" delta="Across all processes" deltaType="positive" isMoney />
            <KpiCard label="At Risk" value="~€4.2K/mo" delta="Revenue exposure" deltaType="negative" isMoney />
          </div>
        </section>

        {/* ============================================ */}
        {/* 2. ACTION CARD — "Your Next Move" */}
        {/* ============================================ */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">2. Action Card — &quot;Your Next Move&quot;</h2>
          <div className={`${t.card} rounded-xl ${t.border} border ${t.shadow} p-6`}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#0d9488] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#0d9488] uppercase tracking-wider mb-2">Your Next Move</p>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Fix error handling on lead capture</h3>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    31% error rate
                  </span>
                  <span className="text-sm text-gray-500">→</span>
                  <span className="text-sm font-medium text-gray-700">HubSpot → Gmail Cold Outreach</span>
                </div>
                <p className="text-base text-gray-600 leading-relaxed mb-4">
                  Then automate manual lead scoring to close the gap in Lead Management. Two moves, ~€2K/mo recovered.
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0d9488] text-white rounded-lg text-sm font-medium hover:bg-[#0f766e] transition">
                  View recommendations <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 3. ALERT CARDS — Attention Items */}
        {/* ============================================ */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">3. Alert Cards — Needs Attention</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AlertCard
              name="HubSpot → Gmail Cold Outreach"
              metric="31% error rate"
              severity="critical"
              impact="Critical"
              process="Lead Management"
            />
            <AlertCard
              name="Employee Onboarding Automation"
              metric="8% error rate"
              severity="attention"
              impact="High"
              process="Employee Onboarding"
            />
            <AlertCard
              name="AI Lead Classification & Routing"
              metric="Inactive, last run 3d ago"
              severity="attention"
              impact="High"
              process="Lead Management"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* 4. OPPORTUNITY CARDS — Recommendations */}
        {/* ============================================ */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">4. Opportunity Cards — Top Recommendations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <OpportunityCard
              name="Add error handling to lead capture"
              brief="Lead capture workflow lacks error handling — silent failures lose inbound leads."
              impact="~€1.2K/mo saved"
              tier="act-now"
              confidence="Data-driven"
            />
            <OpportunityCard
              name="Reduce error rate on status notifications"
              brief="Status notification workflow running at 8% error rate — customers missing updates."
              impact="~€800/mo"
              tier="act-now"
              confidence="Data-driven"
            />
            <OpportunityCard
              name="Connect CRM for full visibility"
              brief="We don't see your CRM data. Connecting it would reveal customer lifecycle gaps."
              impact="Strategic"
              tier="investigate"
              confidence="AI-suggested"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* 5. PROCESS CARDS — Coverage */}
        {/* ============================================ */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">5. Process Cards — Coverage</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProcessCard
              name="Lead Management"
              maturity="Production"
              automatedSteps={3}
              totalSteps={5}
              coverage={60}
              reliability={86}
              recommendations={2}
              valueAtStake="~€2.1K/mo"
            />
            <ProcessCard
              name="Customer Communication"
              maturity="Developing"
              automatedSteps={3}
              totalSteps={4}
              coverage={75}
              reliability={98}
              recommendations={2}
              valueAtStake="~€800/mo"
            />
            <ProcessCard
              name="Employee Onboarding"
              maturity="Emerging"
              automatedSteps={2}
              totalSteps={5}
              coverage={40}
              reliability={97}
              recommendations={2}
              valueAtStake="~€600/mo"
            />
            <ProcessCard
              name="Reporting & Analytics"
              maturity="Production"
              automatedSteps={2}
              totalSteps={3}
              coverage={67}
              reliability={99}
              recommendations={2}
              valueAtStake="~€400/mo"
            />
          </div>
        </section>

        {/* ============================================ */}
        {/* 6. FULL MOCK LAYOUT */}
        {/* ============================================ */}
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">6. Full Dashboard Mock — v4</h2>
          <p className="text-sm text-gray-500 mb-2">Layout follows PRD §3 McKinsey pyramid: answer first, evidence second.</p>
          <p className="text-sm text-gray-500 mb-6">Attention = FACTS (observed problems → Detail page). Opportunities = SUGGESTIONS (recommended actions → Priorities page). Per PRD §7, §9.</p>

          <div className="space-y-6">
            {/* §3: Delta Banner — "Top of Dashboard, below page title, above Your Next Move" */}
            <div className="bg-white rounded-xl border border-[#0d9488]/20 shadow-sm p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0d9488]/10 flex items-center justify-center shrink-0">
                <Activity className="w-4 h-4 text-[#0d9488]" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#0d9488] uppercase tracking-wider">Since last analysis</p>
                <p className="text-base text-gray-700">
                  <span className="font-bold font-[family-name:'JetBrains_Mono'] text-amber-600">2</span> <span className="text-amber-600 font-medium">workflows updated</span>, error rates <span className="text-emerald-600 font-medium">improved</span> on <span className="font-bold font-[family-name:'JetBrains_Mono'] text-emerald-600">1</span> workflow, <span className="font-bold font-[family-name:'JetBrains_Mono'] text-[#0d9488]">1</span> <span className="text-[#0d9488] font-medium">recommendation resolved</span>
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>

            {/* §3: "Your Next Move — 1 specific recommendation" — tinted section with accent border */}
            <div className="border-l-[3px] border-[#0d9488] bg-[#0d9488]/[0.04] rounded-r-xl px-6 py-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0d9488] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-[#0d9488] uppercase tracking-wider">Your Next Move</span>
              </div>

              {/* This IS a recommendation — same card as Priorities page (§5) */}
              <UnifiedCard
                type="recommendation"
                tier="act-now"
                name="Add error handling to lead capture"
                description="Lead capture workflow lacks error handling — silent failures lose inbound leads."
                metric="~€1.2K/mo saved"
                confidence="Data-driven"
                scope="HubSpot → Gmail Cold Outreach"
                process="Lead Management"
              />

              {/* Follow-up action */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-center gap-4 mt-3">
                <span className="text-sm font-medium text-gray-400 shrink-0">Then</span>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-gray-700">Automate manual lead scoring</p>
                  <p className="text-sm text-gray-500">Close the gap in Lead Management</p>
                </div>
                <span className="text-base font-bold font-[family-name:'JetBrains_Mono'] text-[#0d9488] shrink-0">~€800/mo</span>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>

              <p className="text-sm text-gray-400 mt-3"><span className="font-bold font-[family-name:'JetBrains_Mono'] text-gray-900">2</span> moves, total impact: <span className="font-bold font-[family-name:'JetBrains_Mono'] text-[#0d9488]">~€2K/mo recovered</span></p>
            </div>

            {/* §3: Facts Bar — "Workflow count, process count, system count, active count, recommendation count" */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard label="Workflows" value="12" delta="+2 since last sync" deltaType="positive" />
              <KpiCard label="Processes" value="4" />
              <KpiCard label="Active" value="7" delta="of 12 total" deltaType="neutral" />
              <EstimateCard label="Time Saved" value="~12 hrs/wk" explanation="Manual effort replaced by existing automations across all processes" confidence="Benchmark-based" deltaType="positive" />
              <EstimateCard label="At Risk" value="~€4.2K/mo" explanation="Revenue exposure from current error rates, gaps, and unmonitored workflows" confidence="AI-suggested" deltaType="negative" />
            </div>

            {/* §3: "Left: Attention items (→ Detail). Right: Top Opportunities (→ Priorities)" */}
            {/* §7: Attention click → Detail page. Opportunity click → Priorities page. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ATTENTION = FACTS about broken workflows */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Needs Attention</h3>
                  <span className="text-sm font-[family-name:'JetBrains_Mono'] font-semibold text-amber-600">5 items</span>
                </div>
                <div className="space-y-3">
                  {/* These are WORKFLOWS with problems. Click → /automations/[id] (Detail page) */}
                  <UnifiedCard type="attention" severity="critical" name="HubSpot → Gmail Cold Outreach" description="Primary lead capture — entry point for sales pipeline" metric="31% error rate" scope="Step 1 of 5" process="Lead Management" />
                  <UnifiedCard type="attention" severity="attention" name="Employee Onboarding Automation" description="Provisions accounts to Workspace, Slack, Jira, Salesforce" metric="8% error rate" scope="Step 2 of 5" process="Employee Onboarding" />
                  <UnifiedCard type="attention" severity="attention" name="AI Lead Classification & Routing" description="Last executed 3 days ago but marked active" metric="Inactive" scope="Step 3 of 5" process="Lead Management" />
                </div>
                <a className="inline-flex items-center gap-1.5 text-sm text-[#0d9488] font-medium hover:underline mt-3">View all on Process Map <ArrowRight className="w-3.5 h-3.5" /></a>
              </div>

              {/* OPPORTUNITIES = SUGGESTIONS from LLM. Click → /opportunities?highlight={id} */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Top Opportunities</h3>
                  <a className="text-sm text-[#0d9488] font-medium hover:underline inline-flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></a>
                </div>
                <div className="space-y-3">
                  {/* These are RECOMMENDATIONS. Click → /opportunities?highlight={id} */}
                  <UnifiedCard type="recommendation" tier="act-now" name="Reduce error rate on notifications" description="Status notification running at 8% — customers missing updates." metric="~€800/mo in support cost" confidence="Data-driven" scope="3 workflows affected" process="Customer Communication" />
                  <UnifiedCard type="recommendation" tier="act-now" name="Monitor critical data sync" description="High-impact data sync has no monitoring — failures go undetected." metric="~€600/mo risk reduction" confidence="Data-driven" scope="BigQuery → Slack pipeline" process="Reporting & Analytics" />
                  <UnifiedCard type="recommendation" tier="investigate" name="Connect CRM for visibility" description="Customer lifecycle gaps unknown without CRM data." metric="Strategic" confidence="AI-suggested" scope="Salesforce / HubSpot" process="Lead Management" />
                </div>
              </div>
            </div>

            {/* §3: "Process Coverage — Table: process name, coverage bar, reliability" */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Process Coverage</h3>
                <a className="text-sm text-[#0d9488] font-medium hover:underline inline-flex items-center gap-1">Open Process Map <ArrowRight className="w-3.5 h-3.5" /></a>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ProcessCard name="Lead Management" maturity="Production" automatedSteps={3} totalSteps={5} coverage={60} reliability={86} recommendations={2} valueAtStake="~€2.1K/mo" />
                <ProcessCard name="Customer Communication" maturity="Developing" automatedSteps={3} totalSteps={4} coverage={75} reliability={98} recommendations={2} valueAtStake="~€800/mo" />
                <ProcessCard name="Employee Onboarding" maturity="Emerging" automatedSteps={2} totalSteps={5} coverage={40} reliability={97} recommendations={2} valueAtStake="~€600/mo" />
                <ProcessCard name="Reporting & Analytics" maturity="Production" automatedSteps={2} totalSteps={3} coverage={67} reliability={99} recommendations={2} valueAtStake="~€400/mo" />
              </div>
            </div>

            {/* §3: "Systems Compact — One line: names with workflow counts" */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Connected Systems</h3>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { name: "Slack", count: 7 }, { name: "HubSpot", count: 4 }, { name: "Google Sheets", count: 3 },
                  { name: "SendGrid", count: 2 }, { name: "Gmail", count: 2 }, { name: "Google Workspace", count: 2 },
                  { name: "Jira", count: 2 }, { name: "BigQuery", count: 2 }, { name: "Typeform", count: 1 },
                  { name: "Clearbit", count: 1 }, { name: "Salesforce", count: 1 }, { name: "Stripe", count: 1 },
                ].map((sys) => (
                  <span key={sys.name} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 shadow-sm">
                    {sys.name} <span className="font-[family-name:'JetBrains_Mono'] font-bold text-gray-900">{sys.count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// ===================================
// COMPONENT PROTOTYPES
// ===================================

// ESTIMATE CARD — For LLM-estimated values (not hard facts).
// PRD §1: "Transparent reasoning — every insight traces back to the user's own data."
// PRD §3: Estimates secondary with "(methodology →)" text.
function EstimateCard({ label, value, explanation, confidence, deltaType }: {
  label: string;
  value: string;
  explanation: string;
  confidence: string;
  deltaType: "positive" | "negative";
}) {
  const confidenceStyles: Record<string, string> = {
    "Data-driven": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Benchmark-based": "border-dashed bg-amber-50 text-amber-700 border-amber-200",
    "AI-suggested": "bg-gray-50 text-gray-500 border-gray-200",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold font-[family-name:'JetBrains_Mono'] tracking-tight ${
        deltaType === "positive" ? "text-[#0d9488]" : "text-amber-600"
      }`}>
        {value}
      </p>
      <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{explanation}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${confidenceStyles[confidence] ?? confidenceStyles["AI-suggested"]}`}>
          {confidence}
        </span>
        <button className="text-xs text-[#0d9488] font-medium hover:underline">methodology →</button>
      </div>
    </div>
  );
}

// UNIFIED CARD — Same structure for both attention items and recommendations.
// Differs only by accent color and type-specific badges.
// PRD §5: recommendation card fields. PRD §4: workflow card fields.
function UnifiedCard({ type, name, description, metric, scope, process, severity, tier, confidence }: {
  type: "attention" | "recommendation";
  name: string;
  description: string;
  metric: string;
  scope?: string;
  process: string;
  severity?: "critical" | "attention";
  tier?: "act-now" | "investigate" | "explore";
  confidence?: string;
}) {
  const isAttention = type === "attention";

  const borderColor = isAttention
    ? severity === "critical" ? "border-l-red-500" : "border-l-amber-500"
    : tier === "act-now" ? "border-l-emerald-500" : tier === "investigate" ? "border-l-amber-500" : "border-l-gray-400";

  const metricColor = isAttention
    ? severity === "critical" ? "text-red-600" : "text-amber-600"
    : "text-[#0d9488]";

  const tierLabels: Record<string, { bg: string; text: string; label: string }> = {
    "act-now": { bg: "bg-emerald-50", text: "text-emerald-700", label: "Act Now" },
    "investigate": { bg: "bg-amber-50", text: "text-amber-700", label: "Investigate" },
    "explore": { bg: "bg-gray-100", text: "text-gray-600", label: "Explore" },
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-[3px] ${borderColor} shadow-sm p-5 hover:border-gray-300 transition cursor-pointer group`}>
      {/* Row 1: Badges + confidence */}
      <div className="flex items-center gap-2 mb-2">
        {isAttention && (
          <span className={`w-2 h-2 rounded-full shrink-0 ${severity === "critical" ? "bg-red-500" : "bg-amber-500"}`} />
        )}
        {!isAttention && tier && (
          <>
            <Sparkles className="w-3.5 h-3.5 text-[#0d9488]" />
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tierLabels[tier].bg} ${tierLabels[tier].text}`}>
              {tierLabels[tier].label}
            </span>
          </>
        )}
        <span className="flex-1" />
        {confidence && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">{confidence}</span>
        )}
      </div>

      {/* Row 2: Name */}
      <h4 className="text-[15px] font-semibold text-gray-900 group-hover:text-[#0d9488] transition mb-1">{name}</h4>

      {/* Row 3: Description */}
      <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">{description}</p>

      {/* Row 4: Metric + scope + process */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className={`text-lg font-bold font-[family-name:'JetBrains_Mono'] ${metricColor}`}>{metric}</span>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {scope && <span>{scope}</span>}
          {scope && <span>·</span>}
          <span>{process}</span>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta, deltaType, isMoney }: {
  label: string;
  value: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  isMoney?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold font-[family-name:'JetBrains_Mono'] tracking-tight ${
        isMoney && deltaType === "positive" ? "text-[#0d9488]" :
        isMoney && deltaType === "negative" ? "text-amber-600" :
        "text-gray-900"
      }`}>
        {value}
      </p>
      {delta && (
        <p className={`text-sm mt-1 ${
          deltaType === "positive" ? "text-emerald-600" :
          deltaType === "negative" ? "text-amber-600" :
          "text-gray-400"
        }`}>
          {deltaType === "positive" && "↑ "}{deltaType === "negative" && "↓ "}{delta}
        </p>
      )}
    </div>
  );
}

function AlertCard({ name, metric, severity, impact, process }: {
  name: string;
  metric: string;
  severity: "critical" | "attention";
  impact: string;
  process: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-gray-300 transition cursor-pointer group">
      <div className="flex items-start gap-3">
        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
          severity === "critical" ? "bg-red-500" : "bg-amber-500"
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 group-hover:text-[#0d9488] transition truncate">{name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
              severity === "critical" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            }`}>
              {metric}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              impact === "Critical" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
            }`}>
              {impact}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{process}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0d9488] transition mt-1 shrink-0" />
      </div>
    </div>
  );
}

function OpportunityCard({ name, brief, impact, tier, confidence }: {
  name: string;
  brief: string;
  impact: string;
  tier: "act-now" | "investigate" | "explore";
  confidence: string;
}) {
  const tierColors = {
    "act-now": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Act Now" },
    "investigate": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Investigate" },
    "explore": { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", label: "Explore" },
  };
  const tc = tierColors[tier];

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 hover:border-[#0d9488]/40 transition cursor-pointer group ${tc.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0d9488]" />
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tc.bg} ${tc.text}`}>{tc.label}</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500`}>{confidence}</span>
      </div>
      <h4 className="text-[15px] font-semibold text-gray-900 group-hover:text-[#0d9488] transition mb-1">{name}</h4>
      <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">{brief}</p>
      <div className="pt-3 border-t border-gray-100">
        <span className="text-lg font-bold font-[family-name:'JetBrains_Mono'] text-[#0d9488]">{impact}</span>
      </div>
    </div>
  );
}

function ProcessCard({ name, maturity, automatedSteps, totalSteps, coverage, reliability, recommendations, valueAtStake }: {
  name: string;
  maturity: string;
  automatedSteps: number;
  totalSteps: number;
  coverage: number;
  reliability: number;
  recommendations: number;
  valueAtStake: string;
}) {
  const maturityColors: Record<string, string> = {
    "Production": "bg-emerald-50 text-emerald-700",
    "Developing": "bg-blue-50 text-blue-700",
    "Emerging": "bg-amber-50 text-amber-700",
    "Prototype": "bg-gray-100 text-gray-600",
    "Optimized": "bg-[#0d9488]/10 text-[#0d9488]",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-gray-300 transition cursor-pointer group">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-semibold text-gray-900 group-hover:text-[#0d9488] transition">{name}</h4>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${maturityColors[maturity] ?? "bg-gray-100 text-gray-600"}`}>
          {maturity}
        </span>
      </div>

      {/* Coverage bar — BIG */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-500">Coverage</span>
          <span className="text-sm font-semibold font-[family-name:'JetBrains_Mono'] text-gray-700">{automatedSteps} of {totalSteps} steps</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#0d9488] transition-all duration-500"
            style={{ width: `${coverage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-lg font-bold font-[family-name:'JetBrains_Mono'] text-[#0d9488]">{coverage}%</span>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Reliability</p>
          <p className="text-base font-semibold font-[family-name:'JetBrains_Mono'] text-gray-700">{reliability}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">At Risk</p>
          <p className="text-base font-semibold font-[family-name:'JetBrains_Mono'] text-amber-600">{valueAtStake}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Recommendations</p>
          <p className="text-base font-semibold font-[family-name:'JetBrains_Mono'] text-[#0d9488]">{recommendations}</p>
        </div>
      </div>
    </div>
  );
}
