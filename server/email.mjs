const resendApiKey = process.env.RESEND_API_KEY || "";
const fromEmail = process.env.ORDER_EMAIL_FROM || "InstaPlaque <orders@instaplaque.co.uk>";
const adminEmail = process.env.ADMIN_ORDER_EMAIL || process.env.ORDER_ADMIN_EMAIL || "";

export const getEmailConfig = () => ({
  configured: Boolean(resendApiKey),
  hasAdminEmail: Boolean(adminEmail),
  fromEmail,
});

const money = (pence, currency = "gbp") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: String(currency || "gbp").toUpperCase(),
  }).format(Number(pence || 0) / 100);

const orderUrl = (order) => {
  const base = process.env.PUBLIC_SITE_URL || "";
  return base ? `${base.replace(/\/$/, "")}/order-confirmed?order=${encodeURIComponent(order.id)}` : "";
};

export const buildEmail = (template, order, extra = {}) => {
  const orderLink = orderUrl(order);
  const title = order.productTitle || "Custom plaque";
  const total = money(order.totalPence, order.currency);

  if (template === "customer-order-confirmation") {
    return {
      subject: `Order confirmed: ${order.id}`,
      html: `
        <h1>Order confirmed</h1>
        <p>Thanks for your order. Your approved proof has been received for production.</p>
        <p><strong>Order:</strong> ${order.id}<br>
        <strong>Plaque:</strong> ${title}<br>
        <strong>Total paid:</strong> ${total}</p>
        <p>We will prepare your approved proof for production and email you when it is dispatched.</p>
        ${orderLink ? `<p><a href="${orderLink}">View your order</a></p>` : ""}
      `,
      text: [
        "Order confirmed",
        `Order: ${order.id}`,
        `Plaque: ${title}`,
        `Total paid: ${total}`,
        "Your approved proof has been received for production. We will email you when it is dispatched.",
        orderLink ? `View your order: ${orderLink}` : "",
      ].filter(Boolean).join("\n"),
    };
  }

  if (template === "customer-in-production") {
    return {
      subject: `Your plaque is in production: ${order.id}`,
      html: `<h1>Your plaque is in production</h1><p>Your approved proof is now being made.</p><p><strong>Order:</strong> ${order.id}</p>`,
      text: `Your plaque is in production\nOrder: ${order.id}\nYour approved proof is now being made.`,
    };
  }

  if (template === "customer-dispatched") {
    const tracking = extra.trackingReference ? `<p><strong>Tracking/reference:</strong> ${extra.trackingReference}</p>` : "";
    return {
      subject: `Your plaque has been dispatched: ${order.id}`,
      html: `<h1>Your plaque has been dispatched</h1><p>Your order is on its way.</p><p><strong>Order:</strong> ${order.id}</p>${tracking}`,
      text: [
        "Your plaque has been dispatched",
        `Order: ${order.id}`,
        extra.trackingReference ? `Tracking/reference: ${extra.trackingReference}` : "",
      ].filter(Boolean).join("\n"),
    };
  }

  if (template === "admin-new-paid-order") {
    return {
      subject: `New paid InstaPlaque order: ${order.id}`,
      html: `
        <h1>New paid order</h1>
        <p><strong>Order:</strong> ${order.id}<br>
        <strong>Customer:</strong> ${order.customerName || "Customer"} ${order.customerEmail ? `(${order.customerEmail})` : ""}<br>
        <strong>Plaque:</strong> ${title}<br>
        <strong>Total:</strong> ${total}</p>
        ${orderLink ? `<p><a href="${orderLink}">Open order confirmation</a></p>` : ""}
      `,
      text: [
        "New paid order",
        `Order: ${order.id}`,
        `Customer: ${order.customerName || "Customer"} ${order.customerEmail || ""}`,
        `Plaque: ${title}`,
        `Total: ${total}`,
        orderLink,
      ].filter(Boolean).join("\n"),
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
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `Resend email failed (${response.status}).`);
  }

  return { status: "sent", provider: "resend", id: data.id, message };
};

export const getAdminEmail = () => adminEmail;
