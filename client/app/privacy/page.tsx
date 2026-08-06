export const metadata = { title: "Privacy Policy | TextileHub" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Information We Collect</h2>
          <p>
            We collect the information you provide when registering and onboarding (name, email, business
            details, and — for buyers — a saved shipping address), plus activity you generate on the platform such
            as orders, wishlist items, and product reviews.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">How We Use It</h2>
          <p>
            Your information is used to operate the marketplace: matching buyers with relevant suppliers,
            processing orders, sending order-status notifications, and powering search and AI recommendations from
            live catalog data.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Sharing</h2>
          <p>
            Order details (shipping address, items, quantities) are shared with the supplier(s) fulfilling that
            order. We do not sell your personal information to third parties.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Choices</h2>
          <p>
            You can update your saved address and password at any time from your dashboard, and remove items from
            your wishlist whenever you like.
          </p>
        </section>
      </div>
    </div>
  );
}
