import React from 'react';

export function OwnerTestCheckout() {
  return (
    <section className="owner-test-checkout rounded-lg border border-[#2f7f69]/35 bg-[#f0faf5] p-5 text-sm leading-6 text-[#17231f]" aria-label="Owner £1 checkout test">
      <h2 className="text-lg font-black">£1 live checkout test</h2>
      <p className="mt-2 font-bold">123 × 456 mm · £1.00 GBP</p>
      <p className="mt-2">Continue to the private owner checkout to make the real £1 payment. Sign in there with your existing admin passcode.</p>
      <p className="mt-2">This opens the fixed test plaque. Your design will not be manufactured or dispatched.</p>
      <a className="mt-4 flex min-h-[52px] items-center justify-center rounded-lg bg-[#264c36] px-4 py-3 text-center font-black text-white" href="/checkout-test.html">
        Continue to £1 test checkout
      </a>
      <p className="mt-3 text-xs">For an actual plaque in this size, <a className="underline" href="/quote">request a quote</a>.</p>
    </section>
  );
}
