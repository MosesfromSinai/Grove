export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-green-dark flex flex-col items-center justify-center px-6 py-12">
      {children}
    </div>
  );
}
