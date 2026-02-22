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
} from '@hugeicons/core-free-icons'

const DATASETS = [
  {
    name: '311 Complaints',
    icon: Megaphone01Icon,
    color: '#6366f1',
    file: 'csb_latest.json',
    description:
      'Citizen Service Bureau requests covering blight, potholes, graffiti, illegal dumping, and other quality-of-life issues reported by residents.',
    source: 'City of St. Louis CSB',
    coverage: '2020 - 2024',
  },
  {
    name: 'Crime Incidents',
    icon: AlertDiamondIcon,
    color: '#f97316',
    file: 'crime.json',
    description:
      'SLMPD crime reports classified by UCR type with felony/firearm breakdowns, geographic coordinates, and temporal patterns.',
    source: 'St. Louis Metropolitan Police Department',
    coverage: '2020 - 2024',
  },
  {
    name: 'Transit Network',
    icon: Bus01Icon,
    color: '#60a5fa',
    file: 'stops.geojson / shapes.geojson / routes.json',
    description:
      'Metro Bus and MetroLink GTFS data including stop locations, route shapes, frequency counts, and walkshed coverage.',
    source: 'Metro Transit (St. Louis)',
    coverage: 'Current GTFS feed',
  },
  {
    name: 'Vacant Properties',
    icon: Building03Icon,
    color: '#f59e0b',
    file: 'vacancies.json',
    description:
      'Registered vacant building addresses with computed triage scores based on condition, tax delinquency, complaints, and ownership.',
    source: 'City of St. Louis Building Division',
    coverage: 'City registry snapshot',
  },
  {
    name: 'Food Access',
    icon: Store01Icon,
    color: '#ef4444',
    file: 'food_deserts.geojson / grocery_stores.geojson',
    description:
      'USDA Low Income, Low Access (LILA) food desert census tracts and grocery store point-of-sale locations.',
    source: 'USDA Economic Research Service',
    coverage: '2019 definitions',
  },
  {
    name: 'Demographics',
    icon: UserGroupIcon,
    color: '#a855f7',
    file: 'demographics.json',
    description:
      'American Community Survey 5-year estimates including population, race, income, housing occupancy, and decade-over-decade change.',
    source: 'U.S. Census Bureau',
    coverage: 'ACS 2019 - 2023',
  },
  {
    name: 'ARPA Funds',
    icon: DollarCircleIcon,
    color: '#10b981',
    file: 'arpa.json',
    description:
      'American Rescue Plan Act expenditure records by project, category, vendor, and monthly spending timeline.',
    source: 'City of St. Louis Budget Division',
    coverage: '2021 - 2024',
  },
]

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
}

export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          About
        </p>
        <h1 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl">
          STL Urban Analytics
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
          A cross-dataset civic intelligence platform for St. Louis, built to
          make visible the overlapping patterns of disinvestment, service gaps,
          and public spending across the city's 79 neighborhoods.
        </p>
      </motion.header>

      {/* Project narrative */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-16"
      >
        <h2 className="mb-5 text-xl font-semibold">The Project</h2>
        <div className="space-y-4 text-[0.95rem] leading-relaxed text-muted-foreground">
          <p>
            This platform consolidates three hackathon prototypes (a 311
            Complaints explorer, a Transit Equity analyzer, and a Vacancy
            Triage tool) into a single unified interface. Each prototype
            addressed a real problem but existed in isolation. Combining them
            reveals cross-cutting patterns that no single dataset can surface
            alone.
          </p>
          <p>
            All data is sourced from public civic portals and federal agencies.
            The pipeline fetches raw datasets, normalizes them to St. Louis's
            79 official neighborhood boundaries (using zero-padded NHD_NUM
            identifiers), and serves them as static JSON and GeoJSON files for
            fast client-side rendering.
          </p>
          <p>
            The map explorer lets you toggle any combination of seven data
            layers, click into individual neighborhoods for composite scoring,
            and use the analytics drawer for temporal patterns, category
            breakdowns, and cross-dataset correlations.
          </p>
        </div>
      </motion.section>

      {/* Dataset table */}
      <section className="mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-6 text-xl font-semibold"
        >
          Datasets
        </motion.h2>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={stagger}
          className="space-y-2"
        >
          {DATASETS.map((d) => (
            <motion.div
              key={d.name}
              variants={fadeUp}
              className="group flex gap-4 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border"
            >
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${d.color}15` }}
              >
                <HugeiconsIcon
                  icon={d.icon}
                  strokeWidth={2}
                  className="size-4"
                  style={{ color: d.color }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline gap-2">
                  <h3 className="text-sm font-semibold">{d.name}</h3>
                  <span className="text-[0.65rem] text-muted-foreground">
                    {d.coverage}
                  </span>
                </div>
                <p className="mb-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {d.description}
                </p>
                <div className="flex items-center gap-3 text-[0.68rem] text-muted-foreground/70">
                  <span>Source: {d.source}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-border" />
                  <span className="font-mono text-[0.62rem]">{d.file}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4 rounded-xl border border-border/60 bg-muted/40 p-6"
      >
        <div className="flex-1">
          <h3 className="mb-1 text-sm font-semibold">Ready to explore?</h3>
          <p className="text-[0.82rem] text-muted-foreground">
            Open the map explorer to toggle layers, click neighborhoods, and
            see how these datasets intersect.
          </p>
        </div>
        <Link
          to="/explore"
          className="group inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
        >
          Explorer
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </motion.div>
    </div>
  )
}
