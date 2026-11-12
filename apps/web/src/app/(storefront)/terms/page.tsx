export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EC] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Placeholder warning */}
        <div className="mb-8 rounded-lg border-2 border-[#4B2E83] bg-[#D9C7F2] p-6">
          <p className="text-[#1F1A26] font-semibold">
            ⚠️ PLACEHOLDER CONTENT — This is a temporary version. Final legal review is pending.
          </p>
        </div>

        {/* Title */}
        <h1 className="font-serif text-5xl text-[#1F1A26] mb-8">Terms of Service</h1>

        {/* Placeholder content */}
        <div className="prose prose-sm max-w-none text-[#4A4352] space-y-6">
          <section>
            <h2 className="font-serif text-2xl text-[#1F1A26] mb-4 mt-8">1. Agreement to Terms</h2>
            <p>
              [PLACEHOLDER: This section should contain the agreement between the customer and Merlin's Potions,
              including acknowledgment of the terms below. This text has not been reviewed by legal counsel.]
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1F1A26] mb-4 mt-8">2. Use License</h2>
            <p>
              [PLACEHOLDER: This section should describe the license granted to the customer to use the website
              and services. Final terms pending legal review.]
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Item 1 [PLACEHOLDER]</li>
              <li>Item 2 [PLACEHOLDER]</li>
              <li>Item 3 [PLACEHOLDER]</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1F1A26] mb-4 mt-8">3. Disclaimer</h2>
            <p>
              [PLACEHOLDER: Appropriate legal disclaimers regarding the use of the website and products.
              These will be finalized before public launch.]
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1F1A26] mb-4 mt-8">4. Limitations</h2>
            <p>
              [PLACEHOLDER: This section should describe the limitations of liability and other legal protections.
              To be reviewed by legal counsel.]
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1F1A26] mb-4 mt-8">5. Accuracy of Materials</h2>
            <p>
              [PLACEHOLDER: Information regarding the accuracy of content and materials on this website.
              Final wording pending legal review.]
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1F1A26] mb-4 mt-8">6. Links</h2>
            <p>
              [PLACEHOLDER: Terms governing any links to external websites or resources.
              To be finalized before launch.]
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1F1A26] mb-4 mt-8">7. Modifications</h2>
            <p>
              [PLACEHOLDER: Terms describing how these terms may be modified and how users will be notified.
              Pending legal review.]
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1F1A26] mb-4 mt-8">8. Governing Law</h2>
            <p>
              [PLACEHOLDER: This section should specify the jurisdiction and governing law for these terms.
              Final version pending legal counsel review.]
            </p>
          </section>
        </div>

        {/* Last updated notice */}
        <div className="mt-12 pt-8 border-t border-[#E3DDD3] text-sm text-[#6E6676]">
          <p>These terms are currently in placeholder status and will be updated before the site becomes public.</p>
        </div>
      </div>
    </div>
  );
}
