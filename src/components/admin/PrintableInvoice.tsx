
"use client";

import type { EnrichedOrder, OrderItem } from "@/app/admin/orders/page"; // Assuming EnrichedOrder is exported or define a similar type
import QRCode from "qrcode.react";
import Image from "next/image"; // For Earth Puran logo placeholder

interface PrintableInvoiceProps {
  order: EnrichedOrder | null;
}

// Helper to convert number to words (basic implementation for prototype)
const numberToWords = (num: number): string => {
  const a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
  const b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];
  
  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n % 10 !== 0 ? ' ' + a[n%10] : '');
    if (n < 1000) return a[Math.floor(n/100)] + 'hundred ' + (n % 100 !== 0 ? 'and ' + convert(n%100) : '');
    if (n < 100000) return convert(Math.floor(n/1000)) + 'thousand ' + (n % 1000 !== 0 ? convert(n%1000) : '');
    return 'Number too large for words'; // Basic limit
  }
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let words = convert(rupees).trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  words += " Rupees";
  if (paise > 0) {
    words += " and " + convert(paise).trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Paise";
  }
  words += " Only";
  return words;
};


export function PrintableInvoice({ order }: PrintableInvoiceProps) {
  if (!order) {
    return null;
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

  const invoiceDate = new Date().toLocaleDateString('en-GB'); // Or use order.date if preferred
  const invoiceId = `INV-${order.id}`;

  return (
    <div className="printable-invoice-area p-8 font-sans text-xs text-black bg-white">
      {/* Invoice Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* Placeholder for Earth Puran Logo - you can use next/image if you have a logo URL */}
          {/* <Image src="/path/to/earth-puran-logo.png" alt="Earth Puran Logo" width={150} height={50} /> */}
          <h1 className="text-3xl font-bold text-primary">{earthPuranDetails.name}</h1>
          <p>{earthPuranDetails.addressLine1}</p>
          <p>{earthPuranDetails.addressLine2}</p>
          <p>{earthPuranDetails.cityStatePin}</p>
          <p>Phone: {earthPuranDetails.phone}</p>
          <p>Email: {earthPuranDetails.email}</p>
          <p>GSTIN: {earthPuranDetails.gstin}</p>
        </div>
        <div className="text-right">
          <QRCode value={qrCodeValue} size={100} level="H" />
          <p className="font-bold mt-2">Export Invoice</p>
          <p className="text-xs">Supply meant for export without payment of IGST</p>
        </div>
      </div>

      {/* Invoice and Order Details Table */}
      <div className="grid grid-cols-2 gap-4 mb-6 border-t border-b py-2 border-gray-300">
        <div>
          <p><span className="font-semibold">Invoice Code:</span> {invoiceId}</p>
          <p><span className="font-semibold">Invoice Date:</span> {invoiceDate}</p>
        </div>
        <div className="text-right">
          <p><span className="font-semibold">Order No:</span> {order.id}</p>
          <p><span className="font-semibold">Order Date:</span> {order.date}</p>
          <p><span className="font-semibold">Payment Mode:</span> COD</p>
        </div>
      </div>
      

      {/* Addresses */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-semibold mb-1">Bill To / Ship To:</h3>
          <p>{order.shippingDetails.firstName} {order.shippingDetails.lastName}</p>
          <p>{order.shippingDetails.address}</p>
          <p>{order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</p>
          <p>{order.shippingDetails.country}</p>
          <p>Ph: {order.shippingDetails.phoneCountryCode}{order.shippingDetails.phoneNumber}</p>
        </div>
        {/* Optional: If sender details are different or need to be highlighted again */}
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-1 text-left">Sl No.</th>
            <th className="border border-gray-300 p-1 text-left w-1/2">Descriptions of Goods</th>
            <th className="border border-gray-300 p-1 text-right">Qty</th>
            <th className="border border-gray-300 p-1 text-right">Rate (₹)</th>
            <th className="border border-gray-300 p-1 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={item.productId}>
              <td className="border border-gray-300 p-1">{index + 1}</td>
              <td className="border border-gray-300 p-1">
                {item.name}
                {item.productId && <span className="block text-gray-500 text-xs">Product ID: {item.productId}</span>}
              </td>
              <td className="border border-gray-300 p-1 text-right">{item.quantity}</td>
              <td className="border border-gray-300 p-1 text-right">{item.price.toFixed(2)}</td>
              <td className="border border-gray-300 p-1 text-right">{(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td colSpan={4} className="border border-gray-300 p-1 text-right">Total:</td>
            <td className="border border-gray-300 p-1 text-right">{order.totalAmount.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Amount in Words & Declaration */}
      <div className="mb-6">
        <p><span className="font-semibold">Amount Chargeable (in words):</span> {numberToWords(order.totalAmount)}</p>
        <p className="text-xs mt-1">Tax is payable on reverse charge basis: No (Placeholder)</p>
      </div>

      <div className="border-t border-gray-300 pt-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <h4 className="font-semibold mb-1">Declaration:</h4>
                <ol className="list-decimal list-inside text-xs">
                    <li>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</li>
                    <li>All Disputes are subject to Mumbai jurisdiction only. (Placeholder)</li>
                </ol>
            </div>
            <div className="text-right mt-8">
                <p className="mb-10">For {earthPuranDetails.name}</p>
                <p className="border-t border-gray-400 pt-1 inline-block">Authorised Signatory</p>
            </div>
        </div>
      </div>
       <p className="text-center text-xs mt-6">This is a computer-generated invoice and does not require a physical signature.</p>
    </div>
  );
}
