import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Logos from '../components/Logos'
import Features from '../components/Features'
import Stats from '../components/Stats'
import HowItWorks from '../components/HowItWorks'
import Pricing from '../components/Pricing'
import Testimonials from '../components/Testimonials'
import CTA from '../components/CTA'
import Footer from '../components/Footer'

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <Logos />
      <Features />
      <Stats />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  )
}
