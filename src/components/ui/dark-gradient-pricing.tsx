import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BenefitProps {
  text: string
  checked: boolean
  key?: string | number
}

const Benefit = ({ text, checked }: BenefitProps) => {
  return (
    <div className="flex items-start gap-4">
      {checked ? (
        <span className="mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 p-1">
          <Check className="size-3.5 stroke-[3]" />
        </span>
      ) : (
        <span className="mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-zinc-800/50 text-zinc-600 p-1">
          <X className="size-3.5 stroke-[3]" />
        </span>
      )}
      <span className={cn("text-sm leading-relaxed", checked ? "text-zinc-200 font-medium" : "text-zinc-500")}>{text}</span>
    </div>
  )
}

interface PricingCardProps {
  tier: string
  price: string
  bestFor: string
  CTA: string
  benefits: Array<{ text: string; checked: boolean }>
  className?: string
  onClick?: () => void
}

export const PricingCard = ({
  tier,
  price,
  bestFor,
  CTA,
  benefits,
  className,
  onClick,
}: PricingCardProps) => {
  const isPopular = tier === "Medium";
  const [priceAmount, pricePeriod] = price.split('/');

  return (
    <motion.div
      initial={{ filter: "blur(4px)", opacity: 0, y: 20 }}
      whileInView={{ filter: "blur(0px)", opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full"
    >
      <div
        className={cn(
          "relative flex h-full flex-col rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
          isPopular 
            ? "border-indigo-500/50 bg-zinc-900/80 shadow-[0_0_40px_-10px_rgba(99,102,241,0.15)]" 
            : "border-white/10 bg-zinc-950/50 hover:border-white/20",
          className
        )}
      >
        {isPopular && (
          <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-indigo-500 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-indigo-500/30">
            Most Popular
          </div>
        )}
        
        <div className="mb-8">
          <h3 className={cn(
            "mb-3 text-sm font-bold uppercase tracking-[0.15em]",
            isPopular ? "text-indigo-400" : "text-zinc-400"
          )}>
            {tier}
          </h3>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-bold font-heading text-white tracking-tight">
              {priceAmount}
            </span>
            {pricePeriod && (
              <span className="text-lg font-medium text-zinc-500">
                /{pricePeriod}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed min-h-[40px]">
            {bestFor}
          </p>
        </div>

        <div className="mb-8 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="mb-8 flex flex-1 flex-col gap-5">
          {benefits.map((benefit, index) => (
            <Benefit key={index} {...benefit} />
          ))}
        </div>

        <Button
          className={cn(
            "w-full rounded-xl h-14 text-base font-bold transition-all duration-300 mt-auto",
            isPopular
              ? "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25"
              : "bg-white text-black hover:bg-zinc-200"
          )}
          onClick={onClick}
        >
          {CTA}
        </Button>
      </div>
    </motion.div>
  )
}
