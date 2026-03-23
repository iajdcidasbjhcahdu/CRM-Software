"use client";

import Image from "next/image";
import useScrollReveal from "@/hooks/useScrollReveal";
import { useSite } from "@/context/SiteContext";

const stats = [
  { value: "40%", desc: "Faster Task Completion and Automated workflows.", hasCorner: true },
  { value: "3×", desc: "Higher Team Alignment and Real-time updates.", hasCorner: false },
  { value: "100%", desc: "Real-Time Insights Across and Track bottlenecks.", hasCorner: true },
  { value: "10k+", desc: "Active Users Startups, agencies growing teams", hasCorner: false },
];

export default function WhyChoose() {
  const ref = useScrollReveal();
  const site = useSite();

  return (
    <section id="Choose" className="py-[70px] overflow-hidden" ref={ref}>
      <div className="max-w-[1350px] mx-auto px-4">
        <div className="text-center mb-[50px] max-w-[730px] mx-auto">
          <h2 className="reveal text-[36px] md:text-[44px] lg:text-[54px] font-semibold leading-[120%] tracking-[-1.08px] text-dark">
            Why Teams Choose {site.name?.split(" ")[0] || "TaskGo"}
          </h2>
          <p className="reveal text-gray text-[18px] lg:text-[20px] leading-[150%] mt-5 max-w-[617px] mx-auto" style={{ "--delay": "0.15s" }}>
            Trusted by teams to manage work more efficiently. Designed to help teams do their best work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[30px]" style={{ perspective: "50rem" }}>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`reveal-3d border border-border-1 rounded-[20px] p-[30px] relative overflow-hidden flex flex-col justify-between ${
                idx % 2 !== 0 ? "bg-light-gray" : "bg-white"
              }`}
              style={{ gap: idx % 2 !== 0 ? "109px" : "175px", "--delay": `${0.1 + idx * 0.1}s` }}
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[40px] font-semibold leading-[120%] tracking-[-0.8px] text-dark">
                    {stat.value}
                  </h3>
                  <Image src="/images/xt2bkip5sqek.svg" alt="" width={40} height={40} className="w-10 h-10" />
                </div>
                <p className="text-gray text-[20px] leading-[150%]">{stat.desc}</p>
              </div>
              {stat.hasCorner && (
                <Image
                  src="/images/mask-group-3.png"
                  alt=""
                  width={614}
                  height={200}
                  className="absolute bottom-0 left-0 w-full pointer-events-none opacity-40"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
