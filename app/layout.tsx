import './globals.css';
import { PropsWithChildren } from 'react';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';
import { AppProviders } from '@/components/providers/AppProviders';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AuthenticatedLayout>{children}</AuthenticatedLayout>
        </AppProviders>
      </body>
    </html>
  );
}
