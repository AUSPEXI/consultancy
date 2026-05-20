import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready to dominate AI search?
        </h2>
        <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
          Join the top brands securing their Share of Voice in the Generative Engine era.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 h-12 px-8 text-lg">
            Start Your Free Trial
          </Button>
          <Button
            className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 h-12 px-8 text-lg border"
          >
            Book a Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
