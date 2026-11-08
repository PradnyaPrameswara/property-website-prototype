/**
 * Request A Quote form matched to landing-pages/request-a-quote.html.
 * The API is an explicit demo-only acknowledgement; it does not deliver mail.
 */
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const services = [
  "Architectural design", "Interior design", "Urban planning",
  "3D rendering & visualization", "Construction documentation",
  "Feasibility studies", "Project Management", "Sustainable Design",
  "Building Renovation", "Custom home design", "Retail space design",
  "Furniture & fixture selection", "Exterior design", "Decoring", "Painting",
];

const locations = ["Los Angeles, CA", "San Francisco, CA"];

type Status = "idle" | "submitting" | "success" | "error";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    // Preserve the existing API contract without introducing a new backend.
    data.Name = [data["First Name"], data["Last Name"]].filter(Boolean).join(" ").trim();

    setStatus("submitting");

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Quote endpoint rejected the request");

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-3xl bg-neutral-200 p-8">
        <p className="text-xl font-medium text-neutral-800">Thank you for requesting a demo!</p>
        <p className="mt-3 text-base text-neutral-600">The demo endpoint has accepted your details. Email delivery is not configured.</p>
      </div>
    );
  }

  const fieldClass = "h-12 w-full rounded-full border border-neutral-300 bg-neutral-100 px-5 text-base text-neutral-800 placeholder:text-neutral-500 focus:border-brand-primary focus:outline-none";
  const selectClass = "h-12 w-full rounded-full border-neutral-300 bg-neutral-100 px-5 text-base";

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="Quote-First-Name">First name</Label>
        <Input id="Quote-First-Name" name="First Name" required maxLength={256} placeholder="ex. First Name" className={fieldClass} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Quote-Last-Name">Last name</Label>
        <Input id="Quote-Last-Name" name="Last Name" required maxLength={256} placeholder="ex. Last Name" className={fieldClass} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Quote-Email">Email Address</Label>
        <Input id="Quote-Email" name="Email" type="email" required maxLength={256} placeholder="example@youremail.com" className={fieldClass} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Quote-Phone">Phone number</Label>
        <Input id="Quote-Phone" name="Phone" type="tel" required maxLength={256} placeholder="(123) 456 - 7890" className={fieldClass} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="Quote-Location">Location</Label>
        <Select name="Location">
          <SelectTrigger id="Quote-Location" className={selectClass}>
            <SelectValue placeholder="Ex. New York, NY" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="Quote-Service">Service</Label>
        <Select name="Service">
          <SelectTrigger id="Quote-Service" className={selectClass}>
            <SelectValue placeholder="ex. General construction" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="Quote-Company">Company</Label>
        <Input id="Quote-Company" name="Company" required maxLength={256} placeholder="ex. Company" className={fieldClass} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={status === "submitting"} className="cursor-pointer rounded-full border border-brand-primary bg-brand-primary px-8 py-3 text-base font-medium text-neutral-100 transition-transform hover:scale-[0.98] disabled:opacity-60">
          {status === "submitting" ? "Please wait..." : "Get more information"}
        </button>
        {status === "error" && (
          <p className="mt-3 text-sm text-system-red" role="alert">Oops! Something went wrong while submitting the form.</p>
        )}
      </div>
    </form>
  );
}
