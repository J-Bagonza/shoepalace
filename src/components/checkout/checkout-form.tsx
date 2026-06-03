"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useCartActions } from "@/store/cart";
import { formatPrice } from "@/utils/product";
import Image from "next/image";

const SHIPPING_FEE = 300;

interface CheckoutFormProps {
  mpesaEnabled: boolean;
}

export function CheckoutForm({ mpesaEnabled }: CheckoutFormProps) {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const { clearCart } = useCartActions();

  const [values, setValues] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address: "",
    notes: "",
    payment_method: mpesaEnabled
      ? ("mpesa" as "mpesa" | "card" | "cash")
      : ("cash" as "mpesa" | "card" | "cash"),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const total = (subtotal ?? 0) + SHIPPING_FEE;

  function set(key: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!values.customer_name.trim() || values.customer_name.length < 2) {
      newErrors["customer_name"] = "Full name is required";
    }
    if (!values.customer_email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.customer_email)) {
      newErrors["customer_email"] = "Valid email is required";
    }
    if (!values.shipping_address.trim() ||
      values.shipping_address.length < 5) {
      newErrors["shipping_address"] = "Delivery address is required";
    }
    if (items.length === 0) {
      newErrors["items"] = "Your cart is empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          items: items.map((i) => ({
            variant_id: i.variant_id,
            quantity: i.quantity,
          })),
        }),
      });

      const json = await res.json() as {
        data: { orderId: string; total: number } | null;
        error: string | null;
      };

      if (!res.ok || !json.data) {
        setServerError(json.error ?? "Something went wrong.");
        return;
      }

      clearCart();
      router.push(`/orders/${json.data.orderId}`);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-sm text-neutral-400 uppercase tracking-widest">
          Your cart is empty.
        </p>
        <button
          onClick={() => router.push("/products")}
          className="text-xs uppercase tracking-widest text-neutral-900
            underline underline-offset-4 hover:text-[#E8001D] transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-16">
      {/* Left — form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-8"
      >
        {serverError && (
          <div
            role="alert"
            className="border border-[#E8001D] bg-red-50 px-4 py-3
              text-sm text-[#E8001D]"
          >
            {serverError}
          </div>
        )}

        {/* Contact */}
        <fieldset className="flex flex-col gap-5">
          <legend className="text-xs uppercase tracking-widest
            text-neutral-400 mb-2">
            Contact Details
          </legend>
          <Input
            label="Full Name"
            value={values.customer_name}
            onChange={(e) => set("customer_name", e.target.value)}
            error={errors["customer_name"]}
            autoComplete="name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={values.customer_email}
            onChange={(e) => set("customer_email", e.target.value)}
            error={errors["customer_email"]}
            autoComplete="email"
            required
          />
          <Input
            label="Phone (optional)"
            type="tel"
            value={values.customer_phone}
            onChange={(e) => set("customer_phone", e.target.value)}
            error={errors["customer_phone"]}
            autoComplete="tel"
          />
        </fieldset>

        {/* Delivery */}
        <fieldset className="flex flex-col gap-5">
          <legend className="text-xs uppercase tracking-widest
            text-neutral-400 mb-2">
            Delivery Details
          </legend>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest
              text-neutral-500">
              Delivery Address
            </label>
            <textarea
              value={values.shipping_address}
              onChange={(e) => set("shipping_address", e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Street, Area, City"
              className={`w-full border bg-white px-4 py-3 text-sm
                text-neutral-900 placeholder:text-neutral-400
                focus:border-neutral-900 focus:outline-none resize-none
                transition-colors ${
                  errors["shipping_address"]
                    ? "border-[#E8001D]"
                    : "border-neutral-300"
                }`}
            />
            {errors["shipping_address"] && (
              <p className="text-xs text-[#E8001D]" role="alert">
                {errors["shipping_address"]}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest
              text-neutral-500">
              Order Notes (optional)
            </label>
            <textarea
              value={values.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Any special instructions..."
              className="w-full border border-neutral-300 bg-white px-4 py-3
                text-sm text-neutral-900 placeholder:text-neutral-400
                focus:border-neutral-900 focus:outline-none resize-none
                transition-colors"
            />
          </div>
        </fieldset>

        {/* Payment method */}
        <fieldset className="flex flex-col gap-4">
          <legend className="text-xs uppercase tracking-widest
            text-neutral-400 mb-2">
            Payment Method
          </legend>
          {!mpesaEnabled && (
            <div className="border border-neutral-100 bg-[#F5F0E8] px-4 py-3">
              <p className="text-xs text-neutral-500 leading-relaxed">
                This store accepts{" "}
                <span className="font-medium text-neutral-700">
                  Cash on Delivery
                </span>
                . You will pay when your order arrives.
              </p>
            </div>
          )}
          {(mpesaEnabled
            ? (["mpesa", "cash"] as const)
            : (["cash"] as const)
          ).map((method) => (
            <label
              key={method}
              className={`flex items-center gap-4 border px-4 py-4
                cursor-pointer transition-colors ${
                  values.payment_method === method
                    ? "border-neutral-900 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={method}
                checked={values.payment_method === method}
                onChange={() => set("payment_method", method)}
                className="sr-only"
              />
              <div className={`h-4 w-4 rounded-full border-2 flex items-center
                justify-center shrink-0 ${
                  values.payment_method === method
                    ? "border-neutral-900"
                    : "border-neutral-300"
                }`}>
                {values.payment_method === method && (
                  <div className="h-2 w-2 rounded-full bg-neutral-900" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-widest
                  text-neutral-900">
                  {method === "mpesa" ? "M-Pesa" : "Cash on Delivery"}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {method === "mpesa"
                    ? "Pay via M-Pesa. Instructions sent after order."
                    : "Pay cash when your order is delivered."}
                </span>
              </div>
            </label>
          ))}
        </fieldset>

        <Button type="submit" loading={loading}>
          Place Order — {formatPrice(total)}
        </Button>
      </form>

      {/* Right — order summary */}
      <div className="flex flex-col gap-6">
        <h2 className="text-xs uppercase tracking-widest text-neutral-400">
          Order Summary
        </h2>

        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.variant_id} className="flex gap-4">
              <div className="relative h-16 w-14 shrink-0 bg-[#F5F0E8]
                overflow-hidden">
                {item.image_url && (
                  <Image
                    src={item.image_url}
                    alt={item.product_name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {item.product_name}
                </p>
                <p className="text-xs text-neutral-400 uppercase
                  tracking-wider">
                  {item.size} / {item.color}
                </p>
                <p className="text-xs text-neutral-500">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm text-neutral-900 shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-100 pt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest
              text-neutral-500">
              Subtotal
            </span>
            <span className="text-sm text-neutral-900">
              {formatPrice(subtotal ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest
              text-neutral-500">
              Shipping
            </span>
            <span className="text-sm text-neutral-900">
              {formatPrice(SHIPPING_FEE)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t
            border-neutral-100 pt-3">
            <span className="text-xs uppercase tracking-widest
              text-neutral-900 font-medium">
              Total
            </span>
            <span className="text-base font-medium text-neutral-900">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        <p className="text-[10px] text-neutral-400 leading-relaxed">
          By placing your order you agree to our terms of service and
          returns policy.
        </p>
      </div>
    </div>
  );
}