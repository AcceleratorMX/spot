import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SPOT — Project Management",
  description:
    "SPOT is an advanced project management system with Kanban boards, audit logs, and dependency visualization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-background text-foreground`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('spot-theme');
                  var isDark = theme === 'dark' || ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
                  // Block transitions
                  var css = document.createElement('style');
                  css.appendChild(document.createTextNode('* { transition: none !important; }'));
                  document.head.appendChild(css);
                  
                  document.documentElement.classList.toggle('dark', isDark);
                  
                  // Unblock transitions after paint
                  setTimeout(function() {
                    document.head.removeChild(css);
                  }, 10);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
