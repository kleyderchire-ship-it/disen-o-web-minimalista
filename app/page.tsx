import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { Services } from '@/components/services'
import { Results } from '@/components/results'
import { Process } from '@/components/process'
import { Faq } from '@/components/faq'
import { Contact } from '@/components/contact'
import { SiteFooter } from '@/components/site-footer'
import { WorldBackground } from '@/components/three/world-background'

export default function Page() {
  return (
    <>
      <WorldBackground />
      <SiteHeader />
      <main>
        <Hero />
        <Services />
        <Results />
        <Process />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
    </>
  )
}
