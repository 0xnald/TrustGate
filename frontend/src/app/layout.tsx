import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trusted PayGram — Confidential Trust-Gated Payroll",
  description:
    "Pay your team with encrypted stablecoins. Trust scores gate every payment flow. Built on Zama Protocol with ERC-7984.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Trusted PayGram — Confidential Trust-Gated Payroll",
    description:
      "Pay your team with encrypted stablecoins. Trust scores gate every payment flow. Built on Zama Protocol with ERC-7984.",
    url: "https://trusted-paygram.vercel.app",
    siteName: "Trusted PayGram",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trusted PayGram — Confidential Trust-Gated Payroll on Zama FHEVM",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trusted PayGram — Confidential Trust-Gated Payroll",
    description:
      "Pay your team with encrypted stablecoins. Trust scores gate every payment flow. Built on Zama Protocol with ERC-7984.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFBFC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
      </head>
      <body className={dmSans.className}>
        <ThemeProvider>
          <Web3Provider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
