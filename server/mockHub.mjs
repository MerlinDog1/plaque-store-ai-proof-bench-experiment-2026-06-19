import fs from "node:fs/promises";
import path from "node:path";

const storePath = path.join(process.cwd(), "data", "mock-admin-hub-orders.json");

const readOrders = async () => {
  try {
    const text = await fs.readFile(storePath, "utf8");
    return JSON.parse(text);
  } catch {
    return [];
  }
};

const writeOrders = async (orders) => {
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(orders, null, 2));
};

export const createMockHubOrder = async (order) => {
  const orders = await readOrders();
  const nextOrder = {
    ...order,
    hubReceivedAt: new Date().toISOString(),
  };
  await writeOrders([nextOrder, ...orders.filter((item) => item.id !== order.id)]);
  return nextOrder;
};

export const listMockHubOrders = async () => {
  return readOrders();
};
