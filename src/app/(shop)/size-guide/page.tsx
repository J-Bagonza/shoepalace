import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Size Guide" };

const SIZES = [
  { uk: "UK 6", eu: "EU 39", us: "US 7", cm: "24.5" },
  { uk: "UK 7", eu: "EU 40", us: "US 8", cm: "25.4" },
  { uk: "UK 8", eu: "EU 41", us: "US 9", cm: "26.2" },
  { uk: "UK 9", eu: "EU 42", us: "US 10", cm: "27.1" },
  { uk: "UK 10", eu: "EU 43", us: "US 11", cm: "27.9" },
  { uk: "UK 11", eu: "EU 44", us: "US 12", cm: "28.8" },
  { uk: "UK 12", eu: "EU 46", us: "US 13", cm: "29.6" },
] as const;

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen pt-[72px]">
      <div className="bg-[#F5F0E8] py-16 md:py-24">
        <Container size="md">
          <h1 className="font-bebas text-display-md text-neutral-900 leading-none">
            Size Guide
          </h1>
        </Container>
      </div>
      <Container size="md" className="py-16 md:py-24">
        <div className="flex flex-col gap-8 max-w-2xl">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-500 leading-relaxed">
              Measure your foot from heel to toe while standing on a flat
              surface. Use the centimetre measurement for the most accurate
              fit. If you are between sizes, size up.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  {["UK", "EU", "US", "CM"].map((h) => (
                    <th
                      key={h}
                      className="py-3 text-left text-[10px] uppercase
                        tracking-widest text-neutral-400 font-normal pr-8"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZES.map((row, i) => (
                  <tr
                    key={row.uk}
                    className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                  >
                    <td className="py-3 text-xs font-medium text-neutral-900 pr-8">
                      {row.uk}
                    </td>
                    <td className="py-3 text-xs text-neutral-600 pr-8">
                      {row.eu}
                    </td>
                    <td className="py-3 text-xs text-neutral-600 pr-8">
                      {row.us}
                    </td>
                    <td className="py-3 text-xs text-neutral-600">{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border border-neutral-100 p-5 bg-[#F5F0E8]">
            <p className="text-xs text-neutral-500">
              All measurements are approximate. Fit varies by style and brand.
              When in doubt, contact us and we will advise the right size for
              the specific shoe you are buying.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}