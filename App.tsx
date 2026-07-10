import React from 'react';

const App: React.FC = () => (
  <main className="maintenance-page" aria-labelledby="maintenance-title">
    <section className="maintenance-notice">
      <p className="maintenance-brand">InstaPlaque</p>
      <h1 id="maintenance-title">We're making some updates</h1>
      <p className="maintenance-copy">We'll return soon.</p>
      <p className="maintenance-small">
        If you already have an order or proof query, please check back shortly.
      </p>
    </section>
  </main>
);

export default App;
