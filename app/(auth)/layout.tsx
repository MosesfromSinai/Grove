export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden bg-green-dark">
      {children}
    </div>
  );
}
