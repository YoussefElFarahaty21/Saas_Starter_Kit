import './TestimonialsSection.css';

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Founder, LaunchPad',
    avatar: 'SC',
    quote:
      'We went from zero to a billing-enabled MVP in a weekend. The auth and Stripe integration alone saved us weeks.',
  },
  {
    name: 'Marcus Rivera',
    role: 'CTO, Stackflow',
    avatar: 'MR',
    quote:
      'The plan middleware and admin panel are exactly what we needed. We customized the UI and shipped in days, not months.',
  },
  {
    name: 'Emily Nakamura',
    role: 'Indie Developer',
    avatar: 'EN',
    quote:
      'Finally a starter kit that doesn\'t cut corners. JWT, OAuth, and a mobile scaffold — all working out of the box.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="testimonials-section">
      <h2 className="testimonials-section__title">Loved by Builders</h2>
      <p className="testimonials-section__subtitle">
        Developers ship faster when the foundation is already done.
      </p>
      <div className="testimonials-grid">
        {TESTIMONIALS.map((testimonial) => (
          <article key={testimonial.name} className="testimonials-card">
            <p className="testimonials-card__quote">&ldquo;{testimonial.quote}&rdquo;</p>
            <div className="testimonials-card__author">
              <div className="testimonials-card__avatar" aria-hidden="true">
                {testimonial.avatar}
              </div>
              <div>
                <p className="testimonials-card__name">{testimonial.name}</p>
                <p className="testimonials-card__role">{testimonial.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
