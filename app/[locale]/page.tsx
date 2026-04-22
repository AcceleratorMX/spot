import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{t("heading")}</h1>
        <p className="mt-4 text-lg text-gray-600">{t("subtitle")}</p>
      </div>
    </main>
  );
}
