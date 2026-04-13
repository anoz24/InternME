import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'InternMe — Egypt\'s First Micro-Internship Marketplace',
  description: 'Get paid micro-internships based on skills, not university prestige. Build your portfolio, earn real money, and get hired.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1A1A14',
                color: '#F5F3EE',
                borderRadius: '8px',
                border: '0.5px solid rgba(255,255,255,0.1)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#F5E642', secondary: '#1A1A14' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
