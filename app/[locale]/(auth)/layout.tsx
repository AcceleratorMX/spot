type Props = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background via-background to-primary/5">
      {children}
    </div>
  );
}
