import { sanitizeSvgMarkup } from "../services/svgSanitizer.mjs";

const resendApiKey = process.env.RESEND_API_KEY || "";
const fromEmail = process.env.ORDER_EMAIL_FROM || "InstaPlaque <orders@instaplaque.co.uk>";
const adminEmail = process.env.ADMIN_ORDER_EMAIL || process.env.ORDER_ADMIN_EMAIL || "";
const fixedProductionEmail = "etsysign2600@gmail.com";
const USE_CUSTOMER_COPY_PASS = true;
const reviewUrl = process.env.REVIEW_URL || process.env.PUBLIC_REVIEW_URL || "";
const canonicalSiteUrl = "https://instaplaque.co.uk";

const publicSiteRoot = (order = {}) => {
  const configured = process.env.PUBLIC_SITE_URL || "";
  const captured = order.metadata?.publicOrigin || "";
  const base = configured || captured || canonicalSiteUrl;
  return String(base).replace(/\/$/, "").replace(/https:\/\/instaplaque(?:-[^.]+)?\.vercel\.app$/i, canonicalSiteUrl);
};

const orderSessionQuery = (order) =>
  order.stripeCheckoutSessionId ? `&session_id=${encodeURIComponent(order.stripeCheckoutSessionId)}` : "";

export const getEmailConfig = () => ({
  configured: Boolean(resendApiKey),
  hasAdminEmail: Boolean(adminEmail || fixedProductionEmail),
  fromEmail,
});

const uniqueEmails = (values = []) =>
  Array.from(new Set(values.map((value) => String(value || "").trim()).filter((value) => value.includes("@"))));

const money = (pence, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: String(currency || "gbp").toUpperCase(),
  }).format(Number(pence || 0) / 100);

const orderUrl = (order) => {
  const base = publicSiteRoot(order);
  return `${base}/order-confirmed?order=${encodeURIComponent(order.id)}${orderSessionQuery(order)}`;
};

const proofImageUrl = (order) => {
  const root = publicSiteRoot(order);
  if (order.proofPackage?.visualProofPng) {
    const query = order.stripeCheckoutSessionId ? `?session_id=${encodeURIComponent(order.stripeCheckoutSessionId)}` : "";
    return `${root}/api/orders/${encodeURIComponent(order.id)}/proof-image.png${query}`;
  }
  return "";
};

const proofSvg = (order) => sanitizeSvgMarkup(
  order.proofPackage?.visualProofSvg || order.proofPackage?.productionSvg || "",
) || "";

const proofAttachments = (order, includeProof = true, { includeSvg = false } = {}) => {
  if (!includeProof) return [];
  if (order.proofPackage?.visualProofPng) {
    return [
      {
        filename: `${order.id}-approved-proof.png`,
        content: String(order.proofPackage.visualProofPng).replace(/^data:image\/png;base64,/, ""),
        content_id: "approved-proof",
      },
    ];
  }
  const svg = proofSvg(order);
  if (!svg || !includeSvg) return [];
  return [
    {
      filename: `${order.id}-approved-proof.svg`,
      content: Buffer.from(svg, "utf8").toString("base64"),
      content_type: "image/svg+xml",
    },
  ];
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const labelFromSlug = (value = "") =>
  String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const materialLabelFromState = (state = {}) => {
  const labels = {
    "brushed-brass": "Brushed brass",
    "orbital-brass-matt-lacquer": "Orbital brass",
    "polished-brass": "Polished brass",
    "aged-brass": "Aged brass",
    "brushed-stainless": "Brushed stainless",
    "polished-stainless": "Polished stainless",
  };
  return labels[state.material] || labelFromSlug(state.material || "");
};

const stateForOrder = (order) => order.plaqueState || order.state || {};

const plaqueSummaryTitle = (order, fallback = "Custom plaque") => {
  const state = stateForOrder(order);
  const material = materialLabelFromState(state);
  const width = Number(state.width || 0);
  const height = Number(state.height || 0);
  const size = width > 0 && height > 0 ? `${width} x ${height} mm` : "";
  return [material, size].filter(Boolean).join(" / ") || fallback;
};

const emailWordmark = () => `
  <div style="font-family:Montserrat,Arial Black,Arial,Helvetica,sans-serif;font-size:30px;font-weight:900;line-height:.95;letter-spacing:0;mso-line-height-rule:exactly;">
    <span style="color:#f2d688;">Insta</span><span style="color:#fffaf0;">Plaque</span>
  </div>
`;

const customerName = (order) => {
  const raw = String(order.customerName || "").trim();
  if (!raw || raw.toLowerCase() === "customer") return "there";
  return raw.split(/\s+/)[0];
};

const shippingText = (address = {}) =>
  [
    address.name,
    address.phone,
    address.line1,
    address.line2,
    address.city || address.town,
    address.postal_code || address.postcode,
    address.country,
  ].filter(Boolean).join(", ");

const shippingLines = (address = {}) =>
  [
    address.name,
    address.phone ? `Phone: ${address.phone}` : "",
    address.line1,
    address.line2,
    address.city || address.town,
    address.postal_code || address.postcode,
    address.country,
  ].filter(Boolean);

const addWorkingDays = (date, days) => {
  const next = new Date(date);
  let remaining = Math.max(0, Math.round(Number(days || 0)));
  while (remaining > 0) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return next;
};

const turnaroundDaysForOrder = (order) => {
  const metadataDays = Number(order.metadata?.turnaroundWorkingDays || order.metadata?.turnaroundDays || 0);
  if (Number.isFinite(metadataDays) && metadataDays > 0) return metadataDays;
  const state = stateForOrder(order);
  if (state.wood) return state.width <= 420 && state.height <= 297 ? 10 : 15;
  if (state.width > 600 || state.height > 400) return 15;
  if (String(state.material || "").includes("aged")) return 7;
  return 5;
};

const dueDateText = (order) => {
  const start = order.paidAt || order.approvedAt || order.createdAt || new Date().toISOString();
  return addWorkingDays(start, turnaroundDaysForOrder(order)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const woodDetails = (order) => {
  const state = stateForOrder(order);
  if (!state.wood) return "No wood backing";
  const width = Number(state.width || 0);
  const height = Number(state.height || 0);
  const boardWidth = width ? width + 25 : 0;
  const boardHeight = height ? height + 25 : 0;
  const tone = state.woodTone === "light" ? "Light wood" : "Dark wood";
  const edge = state.woodEdge ? `${labelFromSlug(state.woodEdge)} edge` : "";
  const size = boardWidth && boardHeight ? `${boardWidth} x ${boardHeight} mm board` : "";
  return [tone, edge, size].filter(Boolean).join(", ");
};

const plaqueSizeText = (order) => {
  const state = stateForOrder(order);
  return state.width && state.height ? `${state.width} x ${state.height} mm plaque` : "";
};

const fullSvg = (raw, order) => {
  const svg = String(raw || "").trim();
  if (!svg) return "";
  if (/^<svg[\s>]/i.test(svg)) return svg;
  const state = stateForOrder(order);
  const width = Number(state.width || 300);
  const height = Number(state.height || 200);
  const woodExtra = state.wood ? 25 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width + woodExtra} ${height + woodExtra}" width="${width + woodExtra}" height="${height + woodExtra}">${svg}</svg>`;
};

const svgAttachment = (filename, svg) => ({
  filename,
  content: Buffer.from(svg, "utf8").toString("base64"),
  content_type: "image/svg+xml",
});

const internalProductionAttachments = (order) => {
  const attachments = [];
  const visualPng = String(order.proofPackage?.visualProofPng || "").trim();
  if (visualPng) {
    attachments.push({
      filename: `${order.id}-visual-proof.png`,
      content: visualPng.replace(/^data:image\/png;base64,/, ""),
      content_type: "image/png",
    });
  }
  const productionPdf = String(order.proofPackage?.productionArtworkPdf || "").trim();
  if (productionPdf) {
    attachments.push({
      filename: `${order.id}-production-artwork.pdf`,
      content: productionPdf.replace(/^data:application\/pdf;base64,/, ""),
      content_type: "application/pdf",
    });
  }
  return attachments;
};

const plaquePreviewHtml = (order) => {
  const proofUrl = proofImageUrl(order);
  const hasSvg = Boolean(proofSvg(order));
  if (!proofUrl && !order.proofPackage?.visualProofPng && !hasSvg) return "";
  if (!proofUrl && hasSvg) {
    return `
      <div style="padding:18px;background:#f5efe2;border-radius:18px;border:1px solid #e6d8bd;text-align:center;">
        <p style="margin:0;color:#1f2a24;font:700 15px Arial,sans-serif;">Approved proof saved</p>
        <p style="margin:10px 0 0;color:#76684f;font:13px Arial,sans-serif;line-height:1.5;">Your approved proof is saved with the order. Use the order link below to review it.</p>
      </div>
    `;
  }
  return `
      <div style="padding:18px;background:#f5efe2;border:1px solid #e6d8bd;">
      <img src="${escapeHtml(proofUrl || "cid:approved-proof")}" alt="Approved plaque proof" style="display:block;width:100%;max-width:520px;height:auto;margin:0 auto;border:1px solid #e6d8bd;box-shadow:0 18px 42px rgba(36,28,12,.18);" />
      <p style="margin:14px 0 0;text-align:center;color:#76684f;font:12px Arial,sans-serif;">Approved proof.</p>
    </div>
  `;
};

const detailRow = (label, value) => value ? `
  <tr>
    <td style="padding:10px 0;color:#81745f;font:12px Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;color:#1f2a24;font:700 14px Arial,sans-serif;text-align:right;">${escapeHtml(value)}</td>
  </tr>
` : "";

const customerOrderConfirmation = (order, { orderLink, title, total }) => {
  const state = stateForOrder(order);
  const size = state.width && state.height ? `${state.width} x ${state.height} mm` : "";
  const material = materialLabelFromState(state);
  const fixing = labelFromSlug(state.fixing || "");
  const delivery = shippingText(order.shippingAddress);
  const name = customerName(order);

  return {
    subject: `Thank you for your order: ${order.id}`,
    html: `
      <div style="margin:0;padding:0;background:#f3efe6;color:#1f2a24;">
        <div style="display:none;max-height:0;overflow:hidden;">Thank you for your InstaPlaque order. Your approved proof has been received for production.</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3efe6;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffaf0;border-radius:22px;overflow:hidden;border:1px solid #e4d7bf;">
                <tr>
                  <td style="background:#0f2b23;padding:24px 26px;color:#f7f1df;">
                    ${emailWordmark()}
                    <p style="margin:12px 0 0;color:#f3dfaa;font:700 13px Arial,sans-serif;text-transform:uppercase;letter-spacing:.12em;">Order confirmed</p>
                    <h1 style="margin:8px 0 0;color:#fff7df;font:800 30px Georgia,'Times New Roman',serif;line-height:1.14;">Thank you, ${escapeHtml(name)}.</h1>
                    <p style="margin:12px 0 0;color:#dfe9df;font:15px Arial,sans-serif;line-height:1.6;">Your approved plaque proof has been received. We will prepare it for production and email you again when it is dispatched.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:26px;">
                    ${plaquePreviewHtml(order)}
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:collapse;">
                      ${detailRow("Order", order.id)}
                      ${detailRow("Plaque", title)}
                      ${detailRow("Size", size)}
                      ${detailRow("Material", material)}
                      ${detailRow("Fixing", fixing)}
                      ${detailRow("Total paid", total)}
                      ${detailRow("Delivery", delivery)}
                    </table>
                    <div style="margin-top:22px;padding:18px;border-radius:16px;background:#123126;color:#f7f1df;">
                      <h2 style="margin:0 0 10px;font:800 18px Arial,sans-serif;">What happens next</h2>
                      <p style="margin:0;color:#dfe9df;font:14px Arial,sans-serif;line-height:1.6;">${USE_CUSTOMER_COPY_PASS ? "We will check your approved proof before making your plaque, then send a dispatch update when it leaves us." : "We check the production artwork, make your plaque from the approved proof, then send a dispatch update when it leaves us."}</p>
                    </div>
                    ${orderLink ? `
                      <div style="margin-top:24px;text-align:center;">
                        <a href="${escapeHtml(orderLink)}" style="display:inline-block;background:#efc45d;color:#13231d;text-decoration:none;font:800 15px Arial,sans-serif;padding:14px 22px;border-radius:999px;">View your order</a>
                      </div>
                    ` : ""}
                    <p style="margin:24px 0 0;color:#76684f;font:12px Arial,sans-serif;line-height:1.6;">${USE_CUSTOMER_COPY_PASS ? "Please check this email for your records. If you spot anything wrong, reply straight away so we can help before your plaque is made." : "Please check this email for your records. If anything looks wrong, reply as soon as possible before production progresses."}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
    text: [
      `Thank you, ${name}.`,
      "Your InstaPlaque order is confirmed.",
      `Order: ${order.id}`,
      `Plaque: ${title}`,
      size ? `Size: ${size}` : "",
      material ? `Material: ${material}` : "",
      fixing ? `Fixing: ${fixing}` : "",
      `Total paid: ${total}`,
      delivery ? `Delivery: ${delivery}` : "",
      "Your approved proof has been received for production. We will email you when it is dispatched.",
      orderLink ? `View your order: ${orderLink}` : "",
    ].filter(Boolean).join("\n"),
    attachments: proofAttachments(order, true, { includeSvg: false }),
  };
};

const brandedOrderUpdate = (order, {
  subject,
  eyebrow,
  heading,
  intro,
  panelTitle,
  panelCopy,
  orderLink,
  title,
  trackingReference,
  ctaLabel = "View your order",
  ctaUrl = orderLink,
  footer,
  includeProof = true,
  reviewCta = false,
}) => {
  const name = customerName(order);
  const tracking = trackingReference || order.metadata?.trackingReference || "";
  const trackingRow = tracking ? detailRow("Tracking/reference", tracking) : "";
  const reviewLink = reviewUrl || orderLink;
  const primaryCtaUrl = reviewCta ? reviewLink : ctaUrl;
  const primaryCtaLabel = reviewCta ? (reviewUrl ? "Leave a review" : "Send feedback") : ctaLabel;

  return {
    subject,
    html: `
      <div style="margin:0;padding:0;background:#f3efe6;color:#1f2a24;">
        <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(intro)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3efe6;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffaf0;border-radius:22px;overflow:hidden;border:1px solid #e4d7bf;">
                <tr>
                  <td style="background:#0f2b23;padding:24px 26px;color:#f7f1df;">
                    ${emailWordmark()}
                    <p style="margin:12px 0 0;color:#f3dfaa;font:700 13px Arial,sans-serif;text-transform:uppercase;letter-spacing:.12em;">${escapeHtml(eyebrow)}</p>
                    <h1 style="margin:8px 0 0;color:#fff7df;font:800 30px Georgia,'Times New Roman',serif;line-height:1.14;">${escapeHtml(heading.replace("{name}", name))}</h1>
                    <p style="margin:12px 0 0;color:#dfe9df;font:15px Arial,sans-serif;line-height:1.6;">${escapeHtml(intro)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:26px;">
                    ${includeProof ? plaquePreviewHtml(order) : ""}
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px;border-collapse:collapse;">
                      ${detailRow("Order", order.id)}
                      ${detailRow("Plaque", title)}
                      ${trackingRow}
                    </table>
                    <div style="margin-top:22px;padding:18px;border-radius:16px;background:#123126;color:#f7f1df;">
                      <h2 style="margin:0 0 10px;font:800 18px Arial,sans-serif;">${escapeHtml(panelTitle)}</h2>
                      <p style="margin:0;color:#dfe9df;font:14px Arial,sans-serif;line-height:1.6;">${escapeHtml(panelCopy)}</p>
                    </div>
                    ${primaryCtaUrl ? `
                      <div style="margin-top:24px;text-align:center;">
                        <a href="${escapeHtml(primaryCtaUrl)}" style="display:inline-block;background:#efc45d;color:#13231d;text-decoration:none;font:800 15px Arial,sans-serif;padding:14px 22px;border-radius:999px;">${escapeHtml(primaryCtaLabel)}</a>
                      </div>
                    ` : ""}
                    <p style="margin:24px 0 0;color:#76684f;font:12px Arial,sans-serif;line-height:1.6;">${escapeHtml(footer)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
    text: [
      heading.replace("{name}", name),
      intro,
      `Order: ${order.id}`,
      `Plaque: ${title}`,
      tracking ? `Tracking/reference: ${tracking}` : "",
      panelTitle,
      panelCopy,
      primaryCtaUrl ? `${primaryCtaLabel}: ${primaryCtaUrl}` : "",
      footer,
    ].filter(Boolean).join("\n"),
    attachments: proofAttachments(order, includeProof, { includeSvg: false }),
  };
};

export const buildEmail = (template, order, extra = {}) => {
  const orderLink = orderUrl(order);
  const title = plaqueSummaryTitle(order, order.productTitle || "Custom plaque");
  const totalPence = order.totalPence ?? (Number.isFinite(order.total) ? Math.round(order.total * 100) : 0);
  const total = money(totalPence, order.currency);

  if (template === "customer-order-confirmation") {
    return customerOrderConfirmation(order, { orderLink, title, total });
  }

  if (template === "customer-proof-copy") {
    return brandedOrderUpdate(order, {
      subject: `Your approved proof: ${order.id}`,
      eyebrow: "Approved proof",
      heading: "Your proof copy is ready.",
      intro: "A copy of the approved plaque proof is attached for your records.",
      panelTitle: "Saved with your order",
      panelCopy: "This is the proof linked to your confirmed order. We will use it when preparing your plaque for production.",
      orderLink,
      title,
      ctaLabel: "View your order",
      footer: "If anything looks wrong, reply to this email as soon as possible before production progresses.",
      includeProof: true,
    });
  }

  if (template === "customer-in-production") {
    return brandedOrderUpdate(order, {
      subject: `Your plaque is in production: ${order.id}`,
      eyebrow: "In production",
      heading: "Your plaque is being made.",
      intro: "Your approved proof has passed our check and your plaque is now in production.",
      panelTitle: "What happens next",
      panelCopy: "We will finish, check and pack your plaque carefully. You will get another email as soon as it has been dispatched.",
      orderLink,
      title,
      footer: "If you spot anything urgent, reply to this email and we will help before the order moves too far through production.",
    });
  }

  if (template === "customer-dispatched") {
    return brandedOrderUpdate(order, {
      subject: `Your plaque has been dispatched: ${order.id}`,
      eyebrow: "Dispatched",
      heading: "Your plaque is on its way.",
      intro: "Your plaque has left us and is now on its way to you.",
      panelTitle: "Delivery",
      panelCopy: extra.trackingReference || order.metadata?.trackingReference
        ? "Use the tracking or delivery reference below to follow the parcel where the carrier supports tracking."
        : "Most UK mainland orders arrive soon after dispatch. Please keep an eye out for the delivery.",
      orderLink,
      title,
      trackingReference: extra.trackingReference,
      footer: "Thank you again for ordering from InstaPlaque. We hope the finished plaque is exactly what you had in mind.",
    });
  }

  if (template === "customer-review-request") {
    return brandedOrderUpdate(order, {
      subject: `How did we do? ${order.id}`,
      eyebrow: "A quick favour",
      heading: "How did your plaque turn out?",
      intro: "A few days have passed since dispatch, so we wanted to check everything arrived safely.",
      panelTitle: "Your feedback helps",
      panelCopy: "If you are happy with your plaque, a short review really helps other customers order with confidence. If anything is not right, reply and we will help put it right.",
      orderLink,
      title,
      ctaLabel: "Send feedback",
      footer: "Thank you for choosing InstaPlaque.",
      includeProof: false,
      reviewCta: true,
    });
  }

  if (template === "admin-new-paid-order") {
    const address = shippingLines(order.shippingAddress);
    const state = stateForOrder(order);
    const material = materialLabelFromState(state);
    return {
      subject: `New paid InstaPlaque order: ${order.id}`,
      html: `
        <h1>New paid order</h1>
        <p><strong>Order:</strong> ${order.id}<br>
        <strong>Customer:</strong> ${order.customerName || "Customer"} ${order.customerEmail ? `(${order.customerEmail})` : ""}<br>
        <strong>Plaque:</strong> ${title}<br>
        <strong>Total:</strong> ${total}<br>
        <strong>Due:</strong> ${dueDateText(order)}<br>
        <strong>Size:</strong> ${plaqueSizeText(order)}<br>
        <strong>Material:</strong> ${material}<br>
        <strong>Wood:</strong> ${woodDetails(order)}</p>
        <h2>Customer address</h2>
        ${address.length ? `<p>${address.map(escapeHtml).join("<br>")}</p>` : "<p>No shipping address stored yet.</p>"}
        ${orderLink ? `<p><a href="${orderLink}">Open order confirmation</a></p>` : ""}
      `,
      text: [
        "New paid order",
        `Order: ${order.id}`,
        `Customer: ${order.customerName || "Customer"} ${order.customerEmail || ""}`,
        `Plaque: ${title}`,
        `Total: ${total}`,
        `Due: ${dueDateText(order)}`,
        plaqueSizeText(order) ? `Size: ${plaqueSizeText(order)}` : "",
        material ? `Material: ${material}` : "",
        `Wood: ${woodDetails(order)}`,
        "Customer address:",
        address.length ? address.join("\n") : "No shipping address stored yet.",
        orderLink,
      ].filter(Boolean).join("\n"),
      attachments: internalProductionAttachments(order),
    };
  }

  if (template === "admin-production-pack") {
    const address = shippingLines(order.shippingAddress);
    const state = stateForOrder(order);
    const material = materialLabelFromState(state);
    const attachments = internalProductionAttachments(order);
    return {
      subject: `Production pack ready: ${order.id}`,
      html: `
        <h1>Production pack ready</h1>
        <p><strong>Order:</strong> ${order.id}<br>
        <strong>Customer:</strong> ${order.customerName || "Customer"} ${order.customerEmail ? `(${order.customerEmail})` : ""}<br>
        <strong>Plaque:</strong> ${title}<br>
        <strong>Total:</strong> ${total}<br>
        <strong>Due:</strong> ${dueDateText(order)}<br>
        <strong>Size:</strong> ${plaqueSizeText(order)}<br>
        <strong>Material:</strong> ${material}<br>
        <strong>Wood:</strong> ${woodDetails(order)}</p>
        <h2>Customer address</h2>
        ${address.length ? `<p>${address.map(escapeHtml).join("<br>")}</p>` : "<p>No shipping address stored yet.</p>"}
        <p>Attachments: visual proof${attachments.length > 1 ? " and production artwork" : ""}.</p>
        ${orderLink ? `<p><a href="${orderLink}">Open order confirmation</a></p>` : ""}
      `,
      text: [
        "Production pack ready",
        `Order: ${order.id}`,
        `Customer: ${order.customerName || "Customer"} ${order.customerEmail || ""}`,
        `Plaque: ${title}`,
        `Total: ${total}`,
        `Due: ${dueDateText(order)}`,
        plaqueSizeText(order) ? `Size: ${plaqueSizeText(order)}` : "",
        material ? `Material: ${material}` : "",
        `Wood: ${woodDetails(order)}`,
        "Customer address:",
        address.length ? address.join("\n") : "No shipping address stored yet.",
        orderLink,
      ].filter(Boolean).join("\n"),
      attachments,
    };
  }

  return {
    subject: `Order update: ${order.id}`,
    html: `<h1>Order update</h1><p>Your order status is now ${order.status || "updated"}.</p>`,
    text: `Order update\nYour order status is now ${order.status || "updated"}.`,
  };
};

export const sendEmail = async ({ to, template, order, extra = {} }) => {
  const message = buildEmail(template, order, extra);
  if (!to || !String(to).includes("@")) {
    return { status: "skipped", reason: "missing-recipient", message };
  }

  if (!resendApiKey) {
    return { status: "queued-local", provider: "local", message };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.attachments?.length ? { attachments: message.attachments } : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Resend email failed (${response.status}).`);
  }

  return { status: "sent", provider: "resend", id: data.id, message };
};

export const getAdminEmail = () => adminEmail;
export const getInternalProductionEmails = () => uniqueEmails([adminEmail, fixedProductionEmail]);
