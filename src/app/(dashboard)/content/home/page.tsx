// src/app/(dashboard)/content/home/page.tsx
import BackToContent from "@/components/common/BackToContent";
import HomeContentForm from "@/components/content/home-content-form";

export default function HomeContentPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <BackToContent />
        <h1 className="text-[var(--text-page)] font-semibold section-title">
          Edit Home Content
        </h1>
      </div>

      <HomeContentForm />
    </section>
  );
}
