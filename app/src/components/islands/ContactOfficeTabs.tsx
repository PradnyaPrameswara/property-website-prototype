import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const offices = [
  {
    id: "new-york", city: "New York", name: "New York, NY",
    email: "newyork@archipro.com", phone: "(456) 789 - 123",
    image: "/assets/img/6890de8cf77ab5a2a50f1826_new-york-ny-thumbnail-archipro-webflow-template.jpg",
  },
  {
    id: "ottawa", city: "Ottawa", name: "Ottawa, CA",
    email: "ottawa@archipro.com", phone: "(456) 789 - 123",
    image: "/assets/img/6890de8c18b6c782b80bb6f1_ottawa-ca-thumbnail-archipro-webflow-template.jpg",
  },
  {
    id: "amsterdam", city: "Amsterdam", name: "Amsterdam, NL",
    email: "amsterdam@archipro.com", phone: "(456) 789 - 123",
    image: "/assets/img/6890de8ccfd27e3771025405_amsterdam-nl-thumbnail-archipro-webflow-template.jpg",
  },
  {
    id: "london", city: "London", name: "London, UK",
    email: "london@archipro.com", phone: "(456) 789 - 123",
    image: "/assets/img/6890de8c179c56edf965857a_london-uk-thumbnail-archipro-webflow-template.jpg",
  },
];

export default function ContactOfficeTabs() {
  return (
    <Tabs defaultValue="new-york" className="relative w-full">
      {offices.map((office) => (
        <TabsContent
          key={office.id}
          value={office.id}
          className="relative mt-0 min-h-[320px] overflow-hidden rounded-3xl bg-neutral-700 sm:min-h-[480px]"
        >
          <img
            src={office.image}
            width={1228}
            height={630}
            alt={"Archipro office in " + office.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-800/70 to-transparent" />
          <div className="relative z-10 max-w-[330px] p-6 text-neutral-100 sm:p-10">
            <p className="mb-5 text-2xl font-medium">{office.name}</p>
            <p className="text-sm text-neutral-200">Email address</p>
            <a href={"mailto:" + office.email} className="mb-4 block text-sm font-medium underline-offset-2 hover:underline">{office.email}</a>
            <p className="text-sm text-neutral-200">Phone number</p>
            <a href="tel:+1456789123" className="text-sm font-medium underline-offset-2 hover:underline">{office.phone}</a>
          </div>
        </TabsContent>
      ))}
      <TabsList className="relative z-20 mx-auto -mt-[64px] mb-5 flex h-auto w-fit max-w-[calc(100%-24px)] flex-wrap gap-1 rounded-full bg-neutral-800/60 p-1.5 backdrop-blur-sm sm:-mt-[72px]">
        {offices.map((office) => (
          <TabsTrigger
            key={office.id}
            value={office.id}
            className="flex-none rounded-full px-3 py-2 text-xs font-medium text-neutral-100 data-active:bg-neutral-100 data-active:text-neutral-800 sm:px-5 sm:text-sm"
          >
            {office.city}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
