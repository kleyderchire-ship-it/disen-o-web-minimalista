'use client'

import dynamic from 'next/dynamic'

export const HeroSceneLoader = dynamic(
  () => import('./hero-scene').then((mod) => mod.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="size-full animate-pulse rounded-2xl bg-muted" aria-hidden="true" />
    ),
  },
)
