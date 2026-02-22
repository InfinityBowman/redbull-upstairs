import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Megaphone01Icon,
  AlertDiamondIcon,
  Bus01Icon,
  Building03Icon,
  Store01Icon,
  UserGroupIcon,
  DollarCircleIcon,
  ArrowRight01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons'

const DATASETS = [
  {
    name: '311 Complaints',
    icon: Megaphone01Icon,
    color: '#6366f1',
    stat: '~45,000',
    statLabel: 'requests per year',
    description:
      'Every pothole report, graffiti complaint, and illegal dumping flag, mapped to the block it came from.',
    source: 'City of St. Louis CSB',
    coverage: '2020 – 2024',
  },
  {
    name: 'Crime Incidents',
    icon: AlertDiamondIcon,
    color: '#f97316',
    stat: '~28,000',
    statLabel: 'incidents per year',
    description:
      'SLMPD crime reports classified by UCR category, severity, and precise location.',
    source: 'St. Louis Metropolitan Police',
    coverage: '2020 – 2024',
  },
  {
    name: 'Transit Network',
    icon: Bus01Icon,
    color: '#60a5fa',
    stat: '3,800+',
    statLabel: 'stops mapped',
    description:
      'Metro bus stops, MetroLink stations, route geometry, and frequency analysis.',
    source: 'Metro Transit GTFS',
    coverage: 'Current feed',
  },
  {
    name: 'Vacant Properties',
    icon: Building03Icon,
    color: '#f59e0b',
    stat: '7,200+',
    statLabel: 'registered vacancies',
    description:
      'Every registered vacant building, scored by condition, tax status, and ownership chain.',
    source: 'City Building Division',
    coverage: 'Registry snapshot',
  },
  {
    name: 'Food Access',
    icon: Store01Icon,
    color: '#ef4444',
    stat: '23',
    statLabel: 'LILA tracts',
    description:
      'Census tracts where poverty and distance conspire to cut off access to fresh food.',
    source: 'USDA Economic Research Service',
    coverage: '2019 definitions',
  },
  {
    name: 'Demographics',
    icon: UserGroupIcon,
    color: '#a855f7',
    stat: '79',
    statLabel: 'neighborhoods profiled',
    description:
      'Population, race, household income, and housing data broken down to the neighborhood.',
    source: 'U.S. Census Bureau ACS',
    coverage: '2019 – 2023',
  },
  {
    name: 'ARPA Funds',
    icon: DollarCircleIcon,
    color: '#10b981',
    stat: '$517M+',
    statLabel: 'tracked spending',
    description:
      'Federal relief dollars flowing through the city by project, vendor, and timeline.',
    source: 'City Budget Division',
    coverage: '2021 – 2024',
  },
]

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

export function LandingPage() {
  return (
    <div className="w-full overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[oklch(0.975_0.004_260)]">
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(oklch(0 0 0 / 0.03) 1px, transparent 1px), linear-gradient(90deg, oklch(0 0 0 / 0.03) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 45%, oklch(0.85 0.12 264 / 0.18), transparent)',
          }}
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 flex flex-col items-center gap-8 px-6 text-center"
        >
          <motion.div variants={fadeUp}>
            <img
              src="/urbanslu/logo.svg"
              alt="STL Urban Analytics"
              className="h-28 w-auto sm:h-36"
            />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-6xl"
          >
            Seven datasets.{' '}
            <span className="bg-linear-to-r from-[#4f6ef7] to-[#7b93f9] bg-clip-text text-transparent">
              One city.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            A unified analytics platform for St. Louis connecting crime,
            transit, vacancy, food access, and more across all 79 neighborhoods.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex items-center gap-4 pt-2"
          >
            <Link
              to="/explore"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-[#4f6ef7] px-7 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              Open Explorer
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/about"
              className="inline-flex h-11 items-center rounded-lg border border-foreground/10 px-6 text-sm font-medium text-foreground/50 transition-colors hover:border-foreground/20 hover:text-foreground/70"
            >
              Learn More
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' as const }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-5 text-foreground/15"
            aria-hidden="true"
          />
        </motion.div>
      </section>

      {/* ═══ STAT RIBBON ════════════════════════════════════ */}
      <section className="relative border-y border-border/60 bg-[oklch(0.965_0.003_260)]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex max-w-5xl items-center justify-between px-8 py-10 sm:px-12"
        >
          {[
            { value: '7', label: 'Datasets' },
            { value: '6', label: 'Agencies' },
            { value: '79', label: 'Neighborhoods' },
            { value: '100K+', label: 'Data Points' },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-8">
              {i > 0 && <div className="h-8 w-px bg-border/50" />}
              <div className="text-center">
                <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.15em] text-muted-foreground/70">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══ DATASET CHAPTERS ═══════════════════════════════ */}
      {DATASETS.map((d, i) => (
        <DatasetChapter key={d.name} dataset={d} index={i} />
      ))}

      {/* ═══ FINAL CTA ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[oklch(0.97_0.005_260)] px-6 py-32">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 60% at 50% 80%, oklch(0.85 0.1 264 / 0.1), transparent)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto flex max-w-xl flex-col items-center gap-6 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See the whole picture.
          </h2>
          <p className="max-w-md text-muted-foreground">
            Toggle layers, click neighborhoods, and discover the patterns hidden
            across St. Louis's civic data.
          </p>
          <Link
            to="/explore"
            className="group mt-2 inline-flex h-12 items-center gap-2 rounded-lg bg-[#4f6ef7] px-8 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            Open the Explorer
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </motion.div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════ */}
      <footer className="border-t border-border/50 bg-[oklch(0.975_0.004_260)] px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-[0.62rem] text-muted-foreground/50">
          <div className="flex items-center gap-2">
            <img src="/urbanslu/icon.svg" alt="" className="h-4 w-4 rounded" />
            <span className="uppercase tracking-[0.1em]">Urban Analytics</span>
          </div>
          <div className="flex gap-4">
            <Link
              to="/explore"
              className="transition-colors hover:text-foreground/60"
            >
              Explorer
            </Link>
            <Link
              to="/about"
              className="transition-colors hover:text-foreground/60"
            >
              About
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Dataset Chapter ────────────────────────────────────── */

function DatasetChapter({
  dataset,
  index,
}: {
  dataset: (typeof DATASETS)[0]
  index: number
}) {
  const isEven = index % 2 === 0

  return (
    <section
      className={`relative overflow-hidden ${isEven ? 'bg-background' : 'bg-[oklch(0.965_0.003_260)]'}`}
    >
      {/* Color wash */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 45% 55% at ${isEven ? '10%' : '90%'} 50%, ${dataset.color}0c, transparent)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: 'easeOut' as const }}
        className={`mx-auto flex max-w-5xl flex-col gap-6 px-8 py-20 sm:flex-row sm:items-center sm:gap-16 sm:px-12 sm:py-28 ${
          !isEven ? 'sm:flex-row-reverse' : ''
        }`}
      >
        {/* Index + Icon */}
        <div className="shrink-0 sm:w-44">
          <div
            className="text-7xl font-black tabular-nums leading-none sm:text-8xl"
            style={{ color: `${dataset.color}18` }}
          >
            {String(index + 1).padStart(2, '0')}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${dataset.color}15` }}
            >
              <HugeiconsIcon
                icon={dataset.icon}
                strokeWidth={2}
                className="size-4"
                style={{ color: dataset.color }}
              />
            </div>
            <span
              className="text-[0.62rem] font-semibold uppercase tracking-[0.15em]"
              style={{ color: `${dataset.color}90` }}
            >
              Layer {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {dataset.name}
          </h3>
          <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-muted-foreground">
            {dataset.description}
          </p>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex items-baseline gap-3"
          >
            <span
              className="text-4xl font-bold tabular-nums tracking-tight"
              style={{ color: dataset.color }}
            >
              {dataset.stat}
            </span>
            <span className="text-sm text-muted-foreground/60">
              {dataset.statLabel}
            </span>
          </motion.div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[0.62rem] uppercase tracking-[0.1em] text-muted-foreground/40">
            <span>{dataset.source}</span>
            <span>{dataset.coverage}</span>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
