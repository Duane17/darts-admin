// src/app/(dashboard)/content/about/page.tsx
import BackToContent from "@/components/common/BackToContent";
import AboutContentForm from "@/components/content/about-content-form";

export default function AboutContentPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <BackToContent />
        <h1 className="text-[var(--text-page)] font-semibold section-title">
          Edit About Content
        </h1>
      </div>

      <AboutContentForm />
    </section>
  );
}
