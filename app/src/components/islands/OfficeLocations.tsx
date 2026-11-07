import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const locations = [
  {
    value: "new-york",
    label: "New York, NY",
    image: "/assets/img/6890c4e8a2c26923a14b0ec3_new-york-archipro-webflow-template.png",
  },
  {
    value: "amsterdam",
    label: "Amsterdam, NL",
    image: "/assets/img/6890c4e823680e8f3da558f4_amsterdam-archipro-webflow-template.png",
  },
  {
    value: "london",
    label: "London, UK",
    image: "/assets/img/6890c4e8bb449e828fb0404a_london-archipro-webflow-template.png",
  },
  {
    value: "san-francisco",
    label: "San Francisco, CA",
    image: "/assets/img/6890c4e7531b467e094035cf_ottawa-archipro-webflow-template.png",
  },
];

export default function OfficeLocations() {
  return (
    <Tabs defaultValue={locations[0].value} className="w-full">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(240px,0.65fr)_1fr] lg:gap-8">
        <TabsList className="flex h-auto w-full flex-col items-stretch gap-2 bg-transparent p-0">
          {locations.map((location) => (
            <TabsTrigger
              key={location.value}
              value={location.value}
              className="w-full justify-start rounded-2xl border border-neutral-300 bg-neutral-100 px-6 py-5 text-left text-lg font-medium text-neutral-800 data-[active]:border-brand-primary data-[active]:bg-brand-secondary-200 sm:text-xl"
            >
              {location.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-w-0">
          {locations.map((location) => (
            <TabsContent key={location.value} value={location.value} className="mt-0">
              <img
                src={location.image}
                alt={"Archipro office in " + location.label}
                width={1000}
                height={750}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-3xl object-cover"
              />
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  );
}
