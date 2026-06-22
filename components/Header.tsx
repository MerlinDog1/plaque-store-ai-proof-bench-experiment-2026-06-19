import React from 'react';
import { SiteView } from '../services/commerce';

interface Props {
  onNavigate: (view: SiteView) => void;
  onStartDesign: () => void;
  currentView: SiteView;
  priceLabel: string;
  showPrice: boolean;
}

const DELIVERY_HELP = 'UK mainland only. Highlands, islands and non-UK delivery may incur extra charges.';

export const Header: React.FC<Props> = ({ onNavigate, onStartDesign, currentView, priceLabel, showPrice }) => {
  const isDesigner = currentView === 'plaque' || currentView === 'vector';
  const showDesignCta = !isDesigner && currentView !== 'checkout';
  const showCheckoutCta = isDesigner && showPrice;

  return (
    <header className={`proofbench-titlebar print:hidden ${currentView === 'home' ? 'is-home' : ''} ${isDesigner ? 'is-designer' : ''}`}>
      <div className="proofbench-titlebar__inner mx-auto flex h-full max-w-[1540px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button className="proofbench-mark-wrap flex min-w-0 cursor-pointer items-center gap-3 text-left" onClick={() => onNavigate('home')} type="button">
            <div className="min-w-0">
              <span className="brand-wordmark brand-wordmark--header">
                <span>Insta</span><span>Plaque</span>
              </span>
            </div>
          </button>
        </div>

        <div className="proofbench-header-actions flex items-center gap-2">
          {showDesignCta && (
          <button type="button" className="commerce-header-cta inline-flex" onClick={onStartDesign}>
            Design now
          </button>
          )}
          {showPrice && (
            <div className="proofbench-price-chip" aria-label={`Current price ${priceLabel} including UK delivery`}>
              <span className="proofbench-delivery-label">
                Inc UK delivery
                <button type="button" className="proofbench-info-dot" aria-label={DELIVERY_HELP} title={DELIVERY_HELP}>
                  i
                </button>
              </span>
              <strong>
                <svg className="proofbench-price-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.4 8.5h11.2l-.8 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6.4 8.5Z" />
                  <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
                </svg>
                {priceLabel}
              </strong>
            </div>
          )}
          {showCheckoutCta && (
            <button type="button" className="commerce-header-cta inline-flex" onClick={() => onNavigate('checkout')}>
              Checkout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
