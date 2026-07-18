import { ContinueLearning } from "@/components/continue-learning";
import { DailyVerse } from "@/components/daily-verse";
import { FeatureGrid } from "@/components/feature-grid";
import { SearchHero } from "@/components/search-hero";

export default function HomePage() {
  return (
    <div className="space-y-14 pb-20">
      <section className="dawn px-6 pb-14 pt-16 text-center sm:pt-24">
        <p className="eyebrow mb-3">Lumen · Scripture study</p>
        <h1 className="mx-auto max-w-2xl font-scripture text-4xl leading-tight sm:text-5xl">
          Understand the Bible, <span className="text-gilt">connected</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Search by phrase, theme, or question. Compare translations, study the original
          Hebrew and Greek, and see how every story connects.
        </p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchHero />
        </div>
      </section>
      <DailyVerse />
      <ContinueLearning />
      <FeatureGrid />
    </div>
  );
}
