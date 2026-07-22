export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { createInvoiceWorker } = await import("./workers/invoice.worker.js");

    // Cache the worker instance in dev mode to avoid duplicates on hot-reloading
    if (!global.invoiceWorker) {
      global.invoiceWorker = createInvoiceWorker();
      console.log("[Instrumentation] Background Invoice Worker registered and listening.");
    }
  }
}
