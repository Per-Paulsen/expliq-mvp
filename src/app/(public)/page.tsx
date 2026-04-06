import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center px-4 py-12">
      {/* Text block */}
      <div className="flex flex-col items-center text-center max-w-[480px] space-y-3">
        <h1 className="text-4xl font-bold text-foreground">Expliq</h1>
        <p className="text-lg font-semibold text-primary">
          Automation Intelligence
        </p>
        <p className="text-base text-text-secondary">
          See what&apos;s working, what&apos;s broken, and what to build next.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-6 transition-all hover:bg-primary/80"
        >
          Try it out
        </Link>
      </div>

      {/* Workflow graphic */}
      <div className="mt-10 w-full max-w-[700px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 880 480"
          width="880"
          height="480"
          className="w-full h-auto"
        >
          {/* Background */}
          <rect width="880" height="480" fill="#f5f5f7" rx="16" />

          {/* Dot grid pattern (n8n style) */}
          <pattern
            id="dots"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="10" cy="10" r="0.8" fill="#d1d5db" />
          </pattern>
          <rect width="880" height="480" fill="url(#dots)" rx="16" />

          {/* PROCESS: Churn Prevention (TEAL — NEW, top) */}
          <g transform="translate(80, 24)">
            {/* Process frame */}
            <rect
              width="720"
              height="120"
              rx="12"
              fill="#0d9488"
              fillOpacity="0.04"
              stroke="#0d9488"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
            {/* Process label */}
            <rect
              x="12"
              y="-10"
              width="148"
              height="20"
              rx="4"
              fill="#f0fdfa"
              stroke="#99f6e4"
              strokeWidth="1"
            />
            <text
              x="86"
              y="4"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="10"
              fontWeight="600"
              fill="#0d9488"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              Churn Prevention
            </text>
            {/* NEW badge */}
            <rect
              x="168"
              y="-10"
              width="32"
              height="20"
              rx="4"
              fill="#ccfbf1"
              stroke="#5eead4"
              strokeWidth="1"
            />
            <text
              x="184"
              y="4"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="9"
              fontWeight="700"
              fill="#0d9488"
              textAnchor="middle"
            >
              NEW
            </text>

            {/* Sparkles */}
            <g transform="translate(-16, 28)" opacity="0.5">
              <path
                d="M10 0 L12 7 L19 9 L12 11 L10 18 L8 11 L1 9 L8 7 Z"
                fill="#0d9488"
              />
            </g>
            <g transform="translate(-6, 72)" opacity="0.3">
              <path
                d="M5 0 L6 3.5 L9.5 4.5 L6 5.5 L5 9 L4 5.5 L0.5 4.5 L4 3.5 Z"
                fill="#0d9488"
              />
            </g>

            {/* Node 1: Track Usage */}
            <g transform="translate(18, 26)">
              <rect
                width="130"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#0d9488" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              <circle
                cx="130"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              {/* Chart icon */}
              <path
                d="M18 32 L18 18 M18 32 L33 32"
                stroke="#0d9488"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M22 28 L26 22 L29 26 L33 19"
                stroke="#0d9488"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text
                x="42"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#0d9488"
              >
                Track Usage
              </text>
              <text
                x="42"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#5eead4"
              >
                Analytics
              </text>
            </g>

            {/* Connection */}
            <path
              d="M 153 50 C 176 50, 183 50, 206 50"
              stroke="#0d9488"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 2: Detect Risk */}
            <g transform="translate(188, 26)">
              <rect
                width="130"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#0d9488" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              <circle
                cx="130"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              {/* Shield icon */}
              <path
                d="M25 16 L32 19 L32 25 C32 29 29 32 25 34 C21 32 18 29 18 25 L18 19 Z"
                stroke="#0d9488"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
              />
              <path
                d="M25 23 L25 27 M25 29 L25 29.5"
                stroke="#0d9488"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <text
                x="42"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#0d9488"
              >
                Detect Risk
              </text>
              <text
                x="42"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#5eead4"
              >
                Score
              </text>
            </g>

            {/* Connection */}
            <path
              d="M 323 50 C 346 50, 353 50, 376 50"
              stroke="#0d9488"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 3: Offer Discount */}
            <g transform="translate(358, 26)">
              <rect
                width="148"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#0d9488" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              <circle
                cx="148"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              {/* Tag/discount icon */}
              <rect
                x="17"
                y="17"
                width="14"
                height="14"
                rx="2"
                stroke="#0d9488"
                strokeWidth="1.5"
                fill="none"
                transform="rotate(45 24 24)"
              />
              <circle cx="22" cy="22" r="1.5" fill="#0d9488" />
              <text
                x="42"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#0d9488"
              >
                Offer Discount
              </text>
              <text
                x="42"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#5eead4"
              >
                Personalized
              </text>
            </g>

            {/* Connection */}
            <path
              d="M 511 50 C 534 50, 541 50, 564 50"
              stroke="#0d9488"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 4: Notify CSM */}
            <g transform="translate(546, 26)">
              <rect
                width="148"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#0d9488" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              <circle
                cx="148"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="1.5"
              />
              {/* Bell icon */}
              <path
                d="M22 30 C22 30 20 27 20 23 C20 19.5 22.2 17 25 17 C27.8 17 30 19.5 30 23 C30 27 28 30 28 30"
                stroke="#0d9488"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M23 30 L27 30"
                stroke="#0d9488"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="25" cy="33" r="1.5" fill="#0d9488" />
              <text
                x="42"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#0d9488"
              >
                Notify CSM
              </text>
              <text
                x="42"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#5eead4"
              >
                Slack
              </text>
            </g>
          </g>

          {/* PROCESS: Lead Management (gray, bottom) */}
          <g transform="translate(30, 180)">
            {/* Process frame */}
            <rect
              width="820"
              height="270"
              rx="12"
              fill="#ffffff"
              fillOpacity="0.5"
              stroke="#d1d5db"
              strokeWidth="1"
              strokeDasharray="6 3"
            />
            {/* Process label */}
            <rect
              x="12"
              y="-10"
              width="130"
              height="20"
              rx="4"
              fill="#f5f5f7"
              stroke="#d1d5db"
              strokeWidth="1"
            />
            <text
              x="77"
              y="4"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="10"
              fontWeight="600"
              fill="#6b7280"
              textAnchor="middle"
              letterSpacing="0.5"
            >
              Lead Management
            </text>
            {/* Maturity badge */}
            <rect
              x="150"
              y="-10"
              width="64"
              height="20"
              rx="4"
              fill="#dcfce7"
              stroke="#bbf7d0"
              strokeWidth="1"
            />
            <text
              x="182"
              y="4"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontSize="9"
              fontWeight="600"
              fill="#16a34a"
              textAnchor="middle"
            >
              Production
            </text>

            {/* Workflow 1: Inbound Lead Capture (3 nodes) */}

            {/* Node 1: Capture Lead */}
            <g transform="translate(20, 30)">
              <rect
                width="130"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#9ca3af" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <circle
                cx="130"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              {/* Form/inbox icon */}
              <rect
                x="17"
                y="16"
                width="14"
                height="11"
                rx="2"
                stroke="#9ca3af"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M17 19 L24 24 L31 19"
                stroke="#9ca3af"
                strokeWidth="1.3"
                fill="none"
                strokeLinecap="round"
              />
              <rect x="17" y="30" width="14" height="3" rx="1" fill="#e5e7eb" />
              <text
                x="40"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                Capture Lead
              </text>
              <text
                x="40"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#9ca3af"
              >
                Web Form
              </text>
            </g>

            {/* Connection */}
            <path
              d="M 155 54 C 178 54, 185 54, 208 54"
              stroke="#d1d5db"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 2: Enrich Profile */}
            <g transform="translate(190, 30)">
              <rect
                width="140"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#9ca3af" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <circle
                cx="140"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              {/* Person icon */}
              <circle
                cx="23"
                cy="20"
                r="5"
                stroke="#9ca3af"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M16 33 C16 29 19 27 23 27 C27 27 30 29 30 33"
                stroke="#9ca3af"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
              <text
                x="40"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                Enrich Profile
              </text>
              <text
                x="40"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#9ca3af"
              >
                Clearbit
              </text>
            </g>

            {/* Connection */}
            <path
              d="M 335 54 C 358 54, 365 54, 388 54"
              stroke="#d1d5db"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 3: Create in CRM */}
            <g transform="translate(370, 30)">
              <rect
                width="140"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#9ca3af" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <circle
                cx="140"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              {/* Database icon */}
              <ellipse
                cx="25"
                cy="19"
                rx="7"
                ry="4"
                stroke="#9ca3af"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M18 19 L18 30 C18 32.2 21.1 34 25 34 C28.9 34 32 32.2 32 30 L32 19"
                stroke="#9ca3af"
                strokeWidth="1.5"
                fill="none"
              />
              <text
                x="42"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                Create in CRM
              </text>
              <text
                x="42"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#9ca3af"
              >
                HubSpot
              </text>
            </g>

            {/* Workflow 2: Lead Scoring & Assignment (4 nodes) */}

            {/* Node 4: New Deal */}
            <g transform="translate(20, 150)">
              <rect
                width="130"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#9ca3af" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <circle
                cx="130"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              {/* Lightning trigger icon */}
              <path
                d="M28 14 L22 24 L28 24 L22 34"
                stroke="#9ca3af"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text
                x="40"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                New Deal
              </text>
              <text
                x="40"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#9ca3af"
              >
                HubSpot
              </text>
            </g>

            {/* Connection */}
            <path
              d="M 155 174 C 178 174, 185 174, 208 174"
              stroke="#d1d5db"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 5: Score Lead */}
            <g transform="translate(190, 150)">
              <rect
                width="130"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#9ca3af" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <circle
                cx="130"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              {/* Star/score icon */}
              <path
                d="M25 16 L27 22 L33 22 L28 26 L30 32 L25 28 L20 32 L22 26 L17 22 L23 22 Z"
                stroke="#9ca3af"
                strokeWidth="1.5"
                fill="none"
                strokeLinejoin="round"
              />
              <text
                x="42"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                Score Lead
              </text>
              <text
                x="42"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#9ca3af"
              >
                AI Model
              </text>
            </g>

            {/* Connection */}
            <path
              d="M 325 174 C 348 174, 355 174, 378 174"
              stroke="#d1d5db"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 6: Assign Rep */}
            <g transform="translate(360, 150)">
              <rect
                width="130"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#9ca3af" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <circle
                cx="130"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              {/* Assign/arrow-to-person icon */}
              <path
                d="M18 24 L26 24 M23 20 L27 24 L23 28"
                stroke="#9ca3af"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="33"
                cy="24"
                r="3"
                stroke="#9ca3af"
                strokeWidth="1.3"
                fill="none"
              />
              <text
                x="44"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                Assign Rep
              </text>
              <text
                x="44"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#9ca3af"
              >
                Round Robin
              </text>
            </g>

            {/* Connection */}
            <path
              d="M 495 174 C 518 174, 525 174, 548 174"
              stroke="#d1d5db"
              strokeWidth="1.5"
              fill="none"
            />

            {/* Node 7: Notify Slack */}
            <g transform="translate(530, 150)">
              <rect
                width="140"
                height="48"
                rx="8"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <rect width="4" height="48" rx="2" fill="#9ca3af" />
              <circle
                cx="0"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              <circle
                cx="140"
                cy="24"
                r="4.5"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="1.5"
              />
              {/* Chat bubble icon */}
              <rect
                x="17"
                y="17"
                width="16"
                height="12"
                rx="3"
                stroke="#9ca3af"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M20 33 L17 29 L22 29"
                stroke="#9ca3af"
                strokeWidth="1.3"
                fill="none"
                strokeLinejoin="round"
              />
              <path
                d="M22 22 L28 22 M22 25 L26 25"
                stroke="#9ca3af"
                strokeWidth="1.2"
                fill="none"
                strokeLinecap="round"
              />
              <text
                x="42"
                y="24"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="11"
                fontWeight="600"
                fill="#374151"
              >
                Notify Slack
              </text>
              <text
                x="42"
                y="36"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontSize="9"
                fill="#9ca3af"
              >
                Sales Channel
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
