/**
 * Reusable Base UI tabs: original Webflow process labels, image panels and
 * accordion-style tab bodies. Selection is managed by Base UI; no React
 * effects or Webflow runtime.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabItem {
  value: string;
  label: string;
  content: string;
  image?: string;
}

export default function SiteTabs({ items }: { items: TabItem[] }) {
  const hasImages = items.some((item) => Boolean(item.image));

  return (
    <Tabs defaultValue={items[0]?.value} className="w-full">
      <div className={hasImages
        ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)] lg:gap-[102px]"
        : "w-full"}>
        <div className={hasImages ? "min-w-0 lg:order-1" : "min-w-0"}>
          {items.map((item) => (
            <TabsContent key={item.value} value={item.value} className="mt-0">
              {item.image && (
                <img
                  src={item.image}
                  alt={"Project process: " + item.label}
                  width={1292}
                  height={1196}
                  loading="lazy"
                  className="aspect-[1292/1196] w-full rounded-3xl object-cover"
                />
              )}
            </TabsContent>
          ))}
        </div>
        <div className={hasImages ? "lg:order-2" : undefined}>
          <TabsList variant="line" className={hasImages
            ? "flex h-auto w-full flex-col items-stretch gap-0 bg-transparent p-0"
            : "mb-6 flex flex-wrap gap-2"}>
            {items.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={hasImages
                  ? "group after:hidden w-full justify-start rounded-none border-0 border-b border-neutral-300 bg-transparent p-0 py-6 shadow-none h-auto text-left text-2xl font-medium whitespace-normal tracking-tightest text-neutral-400 data-active:text-neutral-800 sm:text-3xl"
                  : "rounded-full px-5 py-2"}
              >
                {hasImages ? (
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-4">
                      <span>{item.label}</span>
                      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xl leading-none text-neutral-800 group-data-[active]:bg-neutral-800 group-data-[active]:text-neutral-100">
                        <span className="group-data-[active]:hidden">+</span>
                        <span className="hidden group-data-[active]:inline">−</span>
                      </span>
                    </div>
                    <p className="hidden max-w-[300px] pt-4 text-base leading-[1.55] font-normal tracking-normal text-neutral-600 group-data-[active]:block">
                      {item.content}
                    </p>
                  </div>
                ) : item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
    </Tabs>
  );
}
