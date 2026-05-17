type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: Props) {
  return (
    <header className="border-b border-border/60 bg-secondary/30">
      <div className="container max-w-4xl py-14 sm:py-20">
        {eyebrow && (
          <div className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="text-balance font-serif text-3xl font-medium tracking-tight sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </header>
  );
}
