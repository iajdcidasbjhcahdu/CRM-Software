import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSiteData } from "@/actions/site.action";
import { SiteProvider } from "@/context/SiteContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return {
    title: name,
    description: name,
  };
}

export default async function RootLayout({ children }) {
  const siteData = await getSiteData();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteProvider siteData={siteData}>
          {children}
        </SiteProvider>
      </body>
    </html>
  );
}
