import BackToContent from "@/components/common/BackToContent";
import AnnouncementsContentForm from "@/components/content/announcements-content-form";

export default function AnnouncementsContentPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <BackToContent />
        <h1 className="text-[var(--text-page)] font-semibold section-title">
          Edit Announcements Page
        </h1>
      </div>

      <AnnouncementsContentForm />
    </section>
  );
}