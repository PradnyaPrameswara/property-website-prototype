/**
 * SubscribeForm — footer newsletter form (guide 2.6).
 * Source: reference/components/form-footer.html ("Footer Form").
 * Webflow `w-form-done`/`w-form-fail` blocks → React state set in onSubmit.
 * Posts to a placeholder endpoint — wire to the real handler at deploy time.
 */
import { useState, type FormEvent } from "react";

import { Check } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

interface SubscribeFormProps {
  variant?: "footer" | "hero" | "newsletter";
}

export default function SubscribeForm({ variant = "footer" }: SubscribeFormProps) {
  const [status, setStatus] = useState<Status>("idle");

  const hero = variant === "hero";

  const newsletter = variant === "newsletter";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("Email");
    setStatus("submitting");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
      <div className="flex items-center gap-3 rounded-2xl bg-neutral-700 p-5" role="status">
        <Check className="size-5 text-brand-secondary-500" aria-hidden />
        <p className="text-sm font-medium text-neutral-100">Thanks for joining our newsletter.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate={false}>
      <div className={hero ? "flex flex-col items-start gap-3 sm:relative sm:flex-row sm:items-center" : "relative flex items-center"}>
        <input
          type="email"
          name="Email"
          required
          maxLength={256}
          placeholder="Enter your email"
          aria-label="Email address"
          className={hero
            ? "h-12 w-full rounded-full border border-white bg-white px-5 text-base text-neutral-800 placeholder:text-neutral-500 focus:border-brand-primary focus:outline-none sm:h-14 sm:pr-40"
            : newsletter
              ? "h-14 w-full rounded-full border border-neutral-300 bg-white pr-32 pl-6 text-base text-neutral-800 placeholder:text-neutral-500 focus:border-brand-primary focus:outline-none"
              : "h-14 w-full rounded-full border border-neutral-100 bg-neutral-100 pr-32 pl-6 text-base text-neutral-800 placeholder:text-neutral-500 focus:border-brand-primary focus:outline-none"
          }
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className={hero
            ? "inline-flex cursor-pointer rounded-full border border-brand-primary bg-brand-primary px-6 py-2.5 text-base font-medium text-neutral-100 transition-transform duration-300 hover:scale-[0.98] disabled:opacity-60 sm:absolute sm:right-1.5"
            : "absolute right-1.5 cursor-pointer rounded-full border border-brand-primary bg-brand-primary px-6 py-2.5 text-base font-medium text-neutral-100 transition-transform duration-300 hover:scale-[0.98] disabled:opacity-60"
          }
        >
          {status === "submitting" ? "Please wait..." : hero ? "Get in touch" : "Subscribe"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-3 text-sm text-system-red" role="alert">
          Oops! Something went wrong while submitting the form.
        </p>
      )}
    </form>
  );
}
