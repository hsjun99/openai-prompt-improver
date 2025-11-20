import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MetaPrompt Studio",
  description: "AI System Prompt Debugger",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    fontFamily: {
                      sans: ['Inter', 'sans-serif'],
                      mono: ['JetBrains Mono', 'monospace'],
                    },
                    colors: {
                      gray: {
                        750: '#2d3342',
                        850: '#1a202c',
                        950: '#0d1117',
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
        <style>{`
          body { background-color: #0d1117; color: #e2e8f0; }
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #0d1117; }
          ::-webkit-scrollbar-thumb { background: #2d3342; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #4a5568; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
