import { PageHeader } from "@/components/PageHeader";
import { APP } from "@/lib/app-config";
import { Linkedin, Mail, Github, ArrowUpRight } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the operator."
        description={`Questions about ${APP.name}, data licensing, or co-launching a ranked-list vertical — all welcome.`}
      />

      <section className="container max-w-3xl py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="https://www.linkedin.com/in/matsiems/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 hover:border-foreground/30"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Linkedin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                LinkedIn
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Fastest way. DMs open.
              </p>
            </div>
          </a>

          <a
            href={`mailto:mat@cleverfox-ai.com?subject=${encodeURIComponent(APP.name)}`}
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 hover:border-foreground/30"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                Email
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                mat@cleverfox-ai.com
              </p>
            </div>
          </a>

          <a
            href={`https://github.com/flexappdev/${APP.domain.toUpperCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 hover:border-foreground/30 sm:col-span-2"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                GitHub
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Source, issues, and the legacy/ archive of the original v2 site.
              </p>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
