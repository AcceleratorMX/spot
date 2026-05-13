import { useTranslations } from "next-intl";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  // If authenticated, redirect to dashboard
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  return <LandingContent locale={locale} />;
}

function LandingContent({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center gap-8 text-center">
        {/* Logo */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-3xl font-bold shadow-lg shadow-primary/25">
          S
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">{t("heading")}</h1>
          <p className="text-xl text-muted-foreground max-w-md">
            {t("subtitle")}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4">
          <Link
            href={`/${locale}/sign-in`}
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            id="landing-sign-in"
          >
            {tNav("signIn")}
          </Link>
          <Link
            href={`/${locale}/sign-up`}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            id="landing-sign-up"
          >
            {tNav("signUp")}
          </Link>
        </div>
      </div>
    </main>
  );
}
