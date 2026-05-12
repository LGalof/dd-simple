type HeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

function Hero({ eyebrow, title, subtitle }: HeroProps) {
  return (
    <section className="hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="subtitle">{subtitle}</p>
    </section>
  );
}

export { Hero };
