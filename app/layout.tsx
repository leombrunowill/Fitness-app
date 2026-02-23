import { PropsWithChildren } from 'react';
import { AuthenticatedLayout } from '@/components/AuthenticatedLayout';

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <AuthenticatedLayout>{children}</AuthenticatedLayout>
      </body>
    </html>
  );
}
