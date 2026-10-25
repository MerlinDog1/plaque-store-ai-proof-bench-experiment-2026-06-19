import React from "react";
import { SiteView } from "../services/commerce";

interface Props {
  onNavigate: (view: SiteView) => void;
  onStartDesign: () => void;
  currentView: SiteView;
  priceLabel: string;
  showPrice: boolean;
  onOpenGuide: () => void;
}

const DELIVERY_HELP =
  "Delivery included throughout the UK, including Northern Ireland, the Highlands and islands.";

export const Header: React.FC<Props> = ({
  onNavigate,
  onStartDesign,
  currentView,
  priceLabel,
  showPrice,
  onOpenGuide,
}) => {
  const isDesigner = currentView === "plaque";
  const isAdmin = currentView === "admin";
  const showDesignCta = !isDesigner && currentView !== "checkout" && !isAdmin;
  const showCheckoutCta = isDesigner && showPrice;

  if (isDesigner) {
    return (
      <header className="designer-header no-print">
        <div className="designer-header-brand">
          <a
            href="/"
            onClick={(event) => {
              if (
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                onNavigate("home");
              }
            }}
          >
            Insta<span>Plaque</span>
          </a>
          <span className="designer-header-divider" />
          <button type="button" className="designer-header-label" aria-haspopup="dialog" aria-controls="designer-guide-dialog" onClick={onOpenGuide}>Design guide &amp; FAQs</button>
        </div>
        <div className="designer-header-actions">
          <button type="button" className="designer-guide-mobile" aria-haspopup="dialog" aria-controls="designer-guide-dialog" onClick={onOpenGuide}>Guide &amp; FAQs</button>
          <a
            className="designer-help"
            href="/contact"
            target="_blank"
            rel="noopener noreferrer"
          >
            Need a hand?
          </a>
          {showPrice && (
            <div
              className="designer-price"
              aria-label={`Current price ${priceLabel} including UK delivery`}
            >
              <strong>{priceLabel}</strong>
              <span>
                Includes UK delivery{" "}
                <button
                  type="button"
                  title={DELIVERY_HELP}
                  aria-label={DELIVERY_HELP}
                >
                  i
                </button>
              </span>
            </div>
          )}
          <button
            type="button"
            className="designer-checkout"
            onClick={() => onNavigate("checkout")}
          >
            Checkout <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>
    );
  }

  if (
    !isDesigner &&
    !isAdmin &&
    currentView !== "checkout" &&
    currentView !== "order-confirmed"
  ) {
    return (
      <header className="shop-header print:hidden">
        <a className="shop-header-brand" href="/">
          Insta<span>Plaque</span>
        </a>
        {/* Garden and brass are the two pages Google shows most (architecture review, owner msg 6264). Narrower
            screens drop the shop-nav-mid links; phones get every link in one row that scrolls sideways. */}
        <nav aria-label="Main navigation">
          <a href="/memorial-plaques">Memorial</a>
          <a href="/bench-plaques">Bench</a>
          <a href="/garden-plaques">Garden</a>
          <a href="/tree-memorial-plaques" className="shop-nav-mid">Tree</a>
          <a href="/opening-plaques">Openings</a>
          <a href="/brass-plaques">Brass</a>
          <a href="/stainless-steel-plaques" className="shop-nav-mid">Stainless</a>
          <a href="/portrait-plaques" className="shop-nav-mid">Portraits</a>
          <a href="/contact" className="shop-nav-contact">Get in touch</a>
        </nav>
        <a
          className="shop-header-cta"
          href="/design"
          onClick={(event) => {
            if (
              !event.ctrlKey &&
              !event.metaKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              onStartDesign();
            }
          }}
        >
          Design your plaque ↗
        </a>
      </header>
    );
  }

  return (
    <header
      className={`proofbench-titlebar print:hidden ${isDesigner ? "is-designer" : ""} ${isAdmin ? "is-admin" : ""}`}
    >
      <div className="proofbench-titlebar__inner mx-auto flex h-full max-w-[1540px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            className="proofbench-mark-wrap flex min-w-0 cursor-pointer items-center gap-3 text-left"
            onClick={() => onNavigate("home")}
            type="button"
          >
            <div className="min-w-0">
              {isAdmin ? (
                <span className="admin-header-title">Order admin</span>
              ) : (
                <span className="brand-wordmark brand-wordmark--header">
                  <span>Insta</span>
                  <span>Plaque</span>
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="proofbench-header-actions flex items-center gap-2">
          {showDesignCta && (
            <button
              type="button"
              className="commerce-header-cta inline-flex"
              onClick={onStartDesign}
            >
              Design now
            </button>
          )}
          {showPrice && (
            <div
              className="proofbench-price-chip"
              aria-label={`Current price ${priceLabel} including UK delivery`}
            >
              <span className="proofbench-delivery-label">
                Inc UK delivery
                <button
                  type="button"
                  className="proofbench-info-dot"
                  aria-label={DELIVERY_HELP}
                  title={DELIVERY_HELP}
                >
                  i
                </button>
              </span>
              <strong>
                <svg
                  className="proofbench-price-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6.4 8.5h11.2l-.8 10.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6.4 8.5Z" />
                  <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
                </svg>
                {priceLabel}
              </strong>
            </div>
          )}
          {showCheckoutCta && (
            <button
              type="button"
              className="commerce-header-cta inline-flex"
              onClick={() => onNavigate("checkout")}
            >
              Checkout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
