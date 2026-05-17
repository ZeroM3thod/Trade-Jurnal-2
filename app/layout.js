import './globals.css';

export const metadata = {
  title: 'Trading Journal',
  description: 'Track your daily trades, deposits, and withdrawals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}