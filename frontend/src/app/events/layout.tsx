// app/events/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upcoming Events | EventHub',
  description: 'Browse and book events that match your interests',
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}