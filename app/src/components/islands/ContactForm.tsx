/**
 * ContactForm — contact pages v1–v3 (guide 2.6).
 * Fields from the raw export: First Name, Last Name, Email, Phone,
 * Service (select), Message. Success/error = w-form-done / w-form-fail.
 */
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const services = [
  "Architectural design",
  "Interior design",
  "Exterior design",
  "Building renovation",
  "Custom home design",
  "3D rendering & visualization",
  "Urban planning",
  "Project management",
];

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");

    try {
      const response = await fetch("/api/contact", {
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
        <Label htmlFor="First-Name">First name</Label>
        <Input id="First-Name" name="First Name" required maxLength={256} placeholder="John" className={fieldClass} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Last-Name">Last name</Label>
        <Input id="Last-Name" name="Last Name" required maxLength={256} placeholder="Doe" className={fieldClass} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Contact-Email">Email</Label>
        <Input id="Contact-Email" name="Email" type="email" required maxLength={256} placeholder="example@youremail.com" className={fieldClass} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Phone">Phone</Label>
        <Input id="Phone" name="Phone" type="tel" maxLength={256} placeholder="(123) 456 - 789" className={fieldClass} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="Service">Service</Label>
        <Select name="Service">
          <SelectTrigger id="Service" className="h-14 w-full rounded-2xl border-neutral-300 bg-neutral-100 px-5 text-base">
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="Message">Message</Label>
        <Textarea id="Message" name="Message" maxLength={5000} placeholder="Tell us about your project" className="min-h-32 w-full rounded-2xl border border-neutral-300 bg-neutral-100 px-5 py-4 text-base text-neutral-800 placeholder:text-neutral-500 focus:border-brand-primary focus:outline-none" />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="cursor-pointer rounded-full border border-brand-primary bg-brand-primary px-8 py-3 text-base font-medium text-neutral-100 shadow-[0_4px_8px_#4d91e11a] transition-transform duration-300 hover:scale-[0.98] disabled:opacity-60"
        >
          {status === "submitting" ? "Please wait..." : "Send message"}
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
