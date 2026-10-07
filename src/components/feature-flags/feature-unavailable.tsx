function FeatureUnavailable({ title }: { title: string }) {
  return (
    <section
      data-slot="feature-unavailable"
      className="glass mx-auto flex max-w-lg flex-col gap-2 rounded-3xl p-6"
    >
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-foreground-subtle">Esta funcionalidade está desativada no momento.</p>
    </section>
  );
}

export { FeatureUnavailable };
