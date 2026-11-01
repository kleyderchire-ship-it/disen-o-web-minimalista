'use client'

import dynamic from 'next/dynamic'

const WorldScene = dynamic(() => import('./world-scene').then((m) => m.WorldScene), {
  ssr: false,
})

export function WorldBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 bg-background" aria-hidden="true">
      <WorldScene />
    </div>
  )
}
