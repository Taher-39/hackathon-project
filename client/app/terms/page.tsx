export const metadata = { title: "Terms & Conditions | TextileHub" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>

      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Use of the Platform</h2>
          <p>
            TextileHub connects textile buyers and suppliers for the purpose of discovering products and placing
            bulk orders. By using this platform, you agree to provide accurate account and business information
            and to use the marketplace only for legitimate sourcing and selling activity.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Orders</h2>
          <p>
            Orders placed through the platform are agreements between the buyer and the supplier. TextileHub
            facilitates discovery and order tracking but does not process payments or guarantee delivery — buyers
            and suppliers are responsible for agreeing on fulfillment terms directly.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Supplier Listings</h2>
          <p>
            Suppliers are responsible for the accuracy of product listings, including pricing, stock, and minimum
            order quantities. Misrepresenting products or inventory may result in account suspension.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Account Responsibility</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all
            activity that occurs under your account.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Changes</h2>
          <p>These terms may be updated from time to time. Continued use of the platform constitutes acceptance of the current terms.</p>
        </section>
      </div>
    </div>
  );
}
