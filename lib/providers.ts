export interface NotificationProvider { send(input: { to: string; subject: string; body: string }): Promise<{ providerRef?: string }> }
export class SandboxNotificationProvider implements NotificationProvider { async send(_input: { to: string; subject: string; body: string }) { return { providerRef: `sandbox-${crypto.randomUUID()}` }; } }
export interface PaymentProvider { createCheckout(input: { bookingId: string; amount: number }): Promise<{ checkoutUrl: string }> }
export class TestPaymentProvider implements PaymentProvider { async createCheckout(input: { bookingId: string }) { return { checkoutUrl: `/payment/test?bookingId=${encodeURIComponent(input.bookingId)}` }; } }
export interface ObjectStorage { put(input: { key: string; body: Buffer; contentType: string }): Promise<{ key: string }> }
export class ConfiguredObjectStorage implements ObjectStorage { async put(input: { key: string }) { if (!process.env.OBJECT_STORAGE_BUCKET) throw new Error('OBJECT_STORAGE_NOT_CONFIGURED'); return { key: input.key }; } }
