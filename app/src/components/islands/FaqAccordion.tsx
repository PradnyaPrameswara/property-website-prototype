/**
 * FaqAccordion — FAQ accordions (guide 2.16).
 * Source: reference/components/accordion-faq.html
 * Base UI Accordion (via ShadCN) holds open-state internally — no useEffect.
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
    <Accordion className="w-full">
      {items.map((item, i) => (
        <AccordionItem key={item.question} value={`faq-${i}`} className="border-b border-neutral-300">
          <AccordionTrigger className="py-5 text-left text-lg font-medium text-neutral-800 hover:text-brand-primary">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-base leading-[1.5em] text-neutral-600">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
