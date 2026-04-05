export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8 space-y-6">
        {children}
      </div>
    </div>
  );
}
