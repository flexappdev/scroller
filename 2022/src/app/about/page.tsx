import { PageHeader } from "@/components/PageHeader";
import { APP, FEATURES, CATEGORIES } from "@/lib/app-config";

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow={APP.name}
        title={`${APP.long}.`}
        description={APP.description}
      />

      <section className="container max-w-3xl py-14">
        <div className="space-y-6">
          <p className="text-base leading-relaxed text-muted-foreground">
            {APP.description}
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Built as a calm, claude.ai-inspired surface — dark by default, light
            on chrome, mobile-first. Categories below give the lay of the land;
            individual feature blocks describe what each page actually does.
          </p>
        </div>

        <div className="mt-12">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Covered
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border bg-card px-3 py-1 text-sm"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 space-y-8">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            The surfaces
          </div>
          {FEATURES.map((f) => (
            <section key={f.anchor} id={f.anchor} className="scroll-mt-20">
              <h2 className="font-serif text-2xl font-medium">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
