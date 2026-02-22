import { createFileRoute } from '@tanstack/react-router'
import { AboutPage } from '@/components/about/AboutPage'

export const Route = createFileRoute('/_app/about')({ component: AboutPage })
