(() => {
  'use strict';
  const login = document.getElementById('login');
  const checkout = document.getElementById('checkout');
  const start = document.getElementById('start');
  const status = document.getElementById('status');
  const measurement = document.getElementById('measurement');
  try { measurement.checked = localStorage.getItem('instaplaque-meta-consent') === 'yes'; } catch { /* Optional storage. */ }
  const check = async () => {
    const response = await fetch('/api/admin/checkout-test', { cache: 'no-store' });
    const data = await response.json();
    if (response.status === 401) {
      login.hidden = false;
      checkout.hidden = true;
      start.disabled = true;
      status.textContent = 'Sign in with your existing admin passcode to run the private test.';
      return;
    }
    if (!response.ok) throw new Error(data.error || 'Could not check test access.');
    login.hidden = true;
    checkout.hidden = false;
    start.disabled = !data.configured || data.mode !== 'live';
    status.textContent = !start.disabled
      ? 'Ready for a real £1 GBP payment. No extra keys are needed.'
      : 'Live checkout is not available. No payment can be started.';
  };
  login.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = login.querySelector('button');
    button.disabled = true;
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: document.getElementById('password').value }),
      });
      document.getElementById('password').value = '';
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign-in failed.');
      await check();
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
  start.addEventListener('click', async () => {
    start.disabled = true;
    status.textContent = 'Opening the real £1 checkout…';
    try {
      try { localStorage.setItem('instaplaque-meta-consent', measurement.checked ? 'yes' : 'no'); }
      catch { /* A storage restriction must not prevent payment; tracking may stay off. */ }
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          liveTest: true, confirmLivePayment: true, totalPence: 100, currency: 'gbp', origin: location.origin, uiMode: 'hosted',
          orderSnapshot: {
            total: 1, currency: 'gbp', proofApproved: true,
            inscription: 'CHECKOUT TEST — DO NOT MAKE',
            state: { width: 123, height: 456, shape: 'rect', material: 'brushed-brass', fixing: 'none', fixingHoleCount: 2, wood: false, memorialImageEnabled: false },
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not start the test checkout.');
      const session = data.session;
      const destination = new URL(session?.url || '');
      if (session.livemode !== true || !/^cs_live_[A-Za-z0-9]+$/.test(session.id || '')
        || destination.origin !== 'https://checkout.stripe.com') {
        throw new Error('The returned checkout was not a live Stripe session. No redirect was made.');
      }
      location.assign(destination.href);
    } catch (error) {
      status.textContent = error.message;
      start.disabled = false;
    }
  });
  check().catch((error) => { status.textContent = error.message; });
})();
