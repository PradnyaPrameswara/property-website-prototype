/**
 * QuoteForm — landing-pages/request-a-quote (guide 2.6).
 * Contact fields + project-type radio group + budget checkboxes,
 * matching the raw form's custom radio/checkbox styling.
 */
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const projectTypes = ["New build", "Renovation", "Interior design", "Consultation"];

const budgetRanges = ["Under $50k", "$50k – $150k", "$150k – $500k", "Over $500k"];

type Status = "idle" | "submitting" | "success" | "error";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl bg-neutral-200 p-8 text-center" role="status">
        <p className="text-lg font-medium text-neutral-800">Thank you! Your submission has been received!</p>
      </div>
    );
  }

  const fieldClass =
    "h-14 w-full rounded-2xl border border-neutral-300 bg-neutral-100 px-5 text-base text-neutral-800 placeholder:text-neutral-500 focus:border-brand-primary focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="Quote-Name">Full name</Label>
        <Input id="Quote-Name" name="Name" required maxLength={256} placeholder="John Doe" className={fieldClass} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Quote-Email">Email</Label>
        <Input id="Quote-Email" name="Email" type="email" required maxLength={256} placeholder="example@youremail.com" className={fieldClass} />
      </div>
      <fieldset className="space-y-3 sm:col-span-2">
        <legend className="text-sm font-medium text-neutral-800">Project type</legend>
        <RadioGroup name="Project type" className="flex flex-wrap gap-4">
          {projectTypes.map((type, i) => (
            <Label key={type} className="flex cursor-pointer items-center gap-2 text-base font-normal">
              <RadioGroupItem value={type} id={`type-${i}`} />
              {type}
            </Label>
          ))}
        </RadioGroup>
      </fieldset>
      <fieldset className="space-y-3 sm:col-span-2">
        <legend className="text-sm font-medium text-neutral-800">Budget range</legend>
        <div className="flex flex-wrap gap-4">
          {budgetRanges.map((range, i) => (
            <Label key={range} className="flex cursor-pointer items-center gap-2 text-base font-normal">
              <Checkbox name="Budget" value={range} id={`budget-${i}`} />
              {range}
            </Label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="Quote-Message">Project details</Label>
        <Textarea id="Quote-Message" name="Message" maxLength={5000} placeholder="Location, size, timeline…" className="min-h-32 w-full rounded-2xl border border-neutral-300 bg-neutral-100 px-5 py-4 text-base text-neutral-800 placeholder:text-neutral-500 focus:border-brand-primary focus:outline-none" />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="cursor-pointer rounded-full border border-brand-primary bg-brand-primary px-8 py-3 text-base font-medium text-neutral-100 shadow-[0_4px_8px_#4d91e11a] transition-transform duration-300 hover:scale-[0.98] disabled:opacity-60"
        >
          {status === "submitting" ? "Please wait..." : "Request a quote"}
        </button>
        {status === "error" && (
          <p className="mt-3 text-sm text-system-red" role="alert">
            Oops! Something went wrong while submitting the form.
          </p>
        )}
      </div>
    </form>
  );
}
