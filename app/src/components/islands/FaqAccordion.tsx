/**
 * FaqAccordion — FAQ accordions (guide 2.16).
 * Source: reference/components/accordion-faq.html — rounded cards with a
 * circular +/- affordance. Base UI Accordion holds open-state internally,
 * so there is no effect or Webflow runtime.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion className="w-full gap-3">
      {items.map((item, i) => (
        <AccordionItem
          key={item.question}
          value={`faq-${i}`}
          className="rounded-2xl border-0 bg-neutral-100 px-5 py-4 sm:px-6 sm:py-5"
        >
          <AccordionTrigger className="w-full justify-between gap-4 py-0 text-left text-base leading-[1.35] font-medium text-neutral-800 hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden sm:text-lg">
            <span>{item.question}</span>
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-lg leading-none text-neutral-800 group-aria-expanded/accordion-trigger:bg-neutral-800 group-aria-expanded/accordion-trigger:text-white">
              <span className="group-aria-expanded/accordion-trigger:hidden">+</span>
              <span className="hidden group-aria-expanded/accordion-trigger:inline">−</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-3 pb-0 text-sm leading-[1.55] text-neutral-600">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
