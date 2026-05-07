const retailers = [
  { name: 'Amazon', color: '#FF9900', bg: '#FFF3E0' },
  { name: 'Walmart', color: '#0071CE', bg: '#E3F2FD' },
  { name: 'Target', color: '#CC0000', bg: '#FFEBEE' },
  { name: 'Costco', color: '#005DAA', bg: '#E3F2FD' },
  { name: 'Kroger', color: '#D4002A', bg: '#FFEBEE' },
  { name: 'Sephora', color: '#000000', bg: '#F3E5F5' },
  { name: 'Staples', color: '#CC0000', bg: '#FFEBEE' },
  { name: 'Home Depot', color: '#F96302', bg: '#FFF3E0' },
]

export default function SocialProof() {
  return (
    <section id="social-proof" className="py-12 bg-white border-y border-brand-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-body font-medium text-brand-light uppercase tracking-widest mb-8">
          Automates purchases across your favorite retailers
        </p>
        <div className="flex flex-wrap justify-center items-center gap-3">
          {retailers.map((retailer) => (
            <div
              key={retailer.name}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-brand-border/80 hover:shadow-warm-sm hover:border-orange-200 transition-all duration-200 group cursor-default"
              style={{ backgroundColor: retailer.bg }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: retailer.color }}
              />
              <span
                className="font-heading font-bold text-sm whitespace-nowrap"
                style={{ color: retailer.color }}
              >
                {retailer.name}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-dashed border-orange-300 bg-orange-50">
            <span className="text-orange-500 font-heading font-bold text-sm">+ More coming</span>
          </div>
        </div>
      </div>
    </section>
  )
}
