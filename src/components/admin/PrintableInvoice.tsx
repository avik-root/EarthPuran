
"use client";

import type { EnrichedOrder, OrderItem } from "@/app/admin/orders/page"; 
import QRCode from "qrcode.react";
import Image from "next/image"; 
import { useState, useEffect } from "react";
import { getTaxRate } from "@/app/actions/taxActions";
import { getShippingSettings } from "@/app/actions/shippingActions";
import type { ShippingSettings } from "@/types/shipping";

interface PrintableInvoiceProps {
  order: EnrichedOrder | null;
}

// Helper to convert number to words (basic implementation for prototype)
const numberToWords = (num: number): string => {
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  
  const convert = (n: number): string => {
    if (n < 0) return "Minus " + convert(Math.abs(n)).trim();
    if (n < 20) return a[n].trim();
    if (n < 100) return (b[Math.floor(n/10)].trim() + (n % 10 !== 0 ? ' ' + a[n%10].trim() : '')).trim();
    if (n < 1000) return (a[Math.floor(n/100)].trim() + ' hundred' + (n % 100 !== 0 ? ' and ' + convert(n%100) : '')).trim();
    if (n < 100000) return (convert(Math.floor(n/1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + convert(n%1000) : '')).trim();
    if (n < 10000000) return (convert(Math.floor(n/100000)) + ' lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '')).trim();
    return 'Number too large for words';
  }
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let words = convert(rupees).split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  words += " Rupees";
  if (paise > 0) {
    words += " and " + convert(paise).split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Paise";
  }
  words += " Only";
  return words;
};


export function PrintableInvoice({ order }: PrintableInvoiceProps) {
  const [taxRate, setTaxRate] = useState<number>(18); // Default tax rate
  const [currentShippingSettings, setCurrentShippingSettings] = useState<ShippingSettings>({rate: 50, threshold: 5000}); // Default shipping
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (order) {
        const fetchSettings = async () => {
            setLoadingSettings(true);
            try {
                const [taxData, shippingData] = await Promise.all([
                    getTaxRate(),
                    getShippingSettings()
                ]);
                setTaxRate(taxData.rate);
                setCurrentShippingSettings(shippingData);
            } catch (e) {
                console.error("Failed to load tax/shipping for invoice:", e);
                // Keep defaults if fetch fails
            } finally {
                setLoadingSettings(false);
            }
        };
        fetchSettings();
    } else {
        setLoadingSettings(false); 
    }
  }, [order]);


  if (!order) {
    return null; 
  }
  
  if (loadingSettings) {
    return (
        <div className="printable-invoice-area p-8 font-sans text-xs text-black bg-white">
            <p>Loading invoice details...</p>
        </div>
    );
  }

  const earthPuranDetails = {
    name: "Earth Puran",
    addressLine1: "123 Nature's Path",
    addressLine2: "Green Valley, Earth",
    cityStatePin: "Mumbai, Maharashtra - 400001",
    phone: "+91 98765 43210",
    gstin: "27AAPCE1234F1Z5", // Placeholder GSTIN
    email: "support@earthpuran.example.com"
  };

  const qrCodeValue = JSON.stringify({
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    orderId: order.id,
    totalAmount: order.totalAmount.toFixed(2),
  });

  const invoiceDate = order.date;
  const invoiceId = `INV-${order.id}`;

  const itemsSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculatedShippingCost = itemsSubtotal >= currentShippingSettings.threshold ? 0 : currentShippingSettings.rate;
  const subtotalForTax = itemsSubtotal + calculatedShippingCost;
  const calculatedTaxAmount = subtotalForTax * (taxRate / 100);
  const totalBeforeAdjustments = itemsSubtotal + calculatedShippingCost + calculatedTaxAmount;
  const discountOrAdjustment = totalBeforeAdjustments - order.totalAmount;


  return (
    <div className="printable-invoice-area p-8 font-sans text-xs text-black bg-white">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">{earthPuranDetails.name}</h1>
          <p>{earthPuranDetails.addressLine1}</p>
          <p>{earthPuranDetails.addressLine2}</p>
          <p>{earthPuranDetails.cityStatePin}</p>
          <p>Phone: {earthPuranDetails.phone}</p>
          <p>Email: {earthPuranDetails.email}</p>
          <p>GSTIN: {earthPuranDetails.gstin}</p>
        </div>
        <div className="text-right">
          <QRCode value={qrCodeValue} size={80} level="H" />
          <p className="font-bold mt-2 text-sm">TAX INVOICE</p>
          {/* <p className="text-xs">Supply meant for export without payment of IGST</p> */}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 border-t border-b py-2 border-gray-300">
        <div>
          <p><span className="font-semibold">Invoice No:</span> {invoiceId}</p>
          <p><span className="font-semibold">Invoice Date:</span> {invoiceDate}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">Order No:</span> {order.id}</p>
          <p><span className="font-semibold">Order Date:</span> {order.date}</p>
          <p><span className="font-semibold">Payment Mode:</span> COD</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-semibold mb-1">Bill To / Ship To:</h3>
          <p>{order.shippingDetails.firstName} {order.shippingDetails.lastName}</p>
          <p>{order.shippingDetails.address}</p>
          <p>{order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</p>
          <p>{order.shippingDetails.country}</p>
          <p>Ph: {order.shippingDetails.phoneCountryCode}{order.shippingDetails.phoneNumber}</p>
        </div>
      </div>

      <table className="w-full mb-2 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-1 text-left text-xs">Sl.</th>
            <th className="border border-gray-300 p-1 text-left text-xs w-2/5">Item Description</th>
            <th className="border border-gray-300 p-1 text-right text-xs">HSN/SAC</th>
            <th className="border border-gray-300 p-1 text-right text-xs">Qty</th>
            <th className="border border-gray-300 p-1 text-right text-xs">Rate (₹)</th>
            {/* <th className="border border-gray-300 p-1 text-right text-xs">Discount (₹)</th> */}
            <th className="border border-gray-300 p-1 text-right text-xs">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {order.items && order.items.map((item, index) => (
            <tr key={item.productId || `item-${index}`}>
              <td className="border border-gray-300 p-1 text-xs">{index + 1}</td>
              <td className="border border-gray-300 p-1 text-xs">
                {item.name}
                {item.productId && <span className="block text-gray-500 text-xs mt-0.5">ID: {item.productId}</span>}
              </td>
              <td className="border border-gray-300 p-1 text-right text-xs">N/A</td>
              <td className="border border-gray-300 p-1 text-right text-xs">{item.quantity}</td>
              <td className="border border-gray-300 p-1 text-right text-xs">{item.price.toFixed(2)}</td>
              {/* <td className="border border-gray-300 p-1 text-right text-xs">0.00</td> */}
              <td className="border border-gray-300 p-1 text-right text-xs">{(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-4">
        <div className="w-2/5">
            <div className="flex justify-between py-0.5">
                <span className="font-semibold text-xs">Items Subtotal:</span>
                <span className="text-xs">₹{itemsSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-0.5">
                <span className="font-semibold text-xs">Shipping Charges:</span>
                <span className="text-xs">₹{calculatedShippingCost.toFixed(2)}</span>
            </div>
             <div className="flex justify-between py-0.5 border-t border-gray-300 mt-0.5 pt-0.5">
                <span className="font-semibold text-xs">Subtotal (for Tax):</span>
                <span className="text-xs">₹{subtotalForTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-0.5">
                <span className="font-semibold text-xs">Tax ({taxRate}%):</span>
                <span className="text-xs">₹{calculatedTaxAmount.toFixed(2)}</span>
            </div>
            {discountOrAdjustment !== 0 && (
              <div className="flex justify-between py-0.5">
                <span className="font-semibold text-xs">{discountOrAdjustment > 0 ? "Discount:" : "Adjustments:"}</span>
                <span className="text-xs">{discountOrAdjustment > 0 ? "- " : "+ "}₹{Math.abs(discountOrAdjustment).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold py-1 border-t border-b border-gray-300 mt-0.5">
                <span className="text-sm">Grand Total (Paid):</span>
                <span className="text-sm">₹{order.totalAmount.toFixed(2)}</span>
            </div>
        </div>
      </div>


      <div className="mb-6">
        <p className="text-xs"><span className="font-semibold">Amount Chargeable (in words):</span> {numberToWords(order.totalAmount)}</p>
        <p className="text-xs mt-0.5">Tax is payable on reverse charge basis: No (This is a placeholder)</p>
      </div>

      <div className="border-t border-gray-300 pt-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold mb-1 text-xs">Declaration:</h4>
                <ol className="list-decimal list-inside text-xs space-y-0.5">
                    <li>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</li>
                    <li>All Disputes are subject to Mumbai jurisdiction only. (Placeholder)</li>
                </ol>
            </div>
            <div className="text-right mt-8">
                <p className="mb-10 text-xs">For {earthPuranDetails.name}</p>
                <p className="border-t border-gray-400 pt-1 inline-block text-xs">Authorised Signatory</p>
            </div>
        </div>
      </div>
       <p className="text-center text-xs mt-6">This is a computer-generated invoice and does not require a physical signature.</p>
    </div>
  );
}

