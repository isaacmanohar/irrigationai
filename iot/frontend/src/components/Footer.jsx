const Footer = ({ t }) => {
  const footerLinks = [
    { label: t('footer_l1') || "About the Project", href: "#" },
    { label: t('footer_l2') || "Documentation", href: "#" },
    { label: t('footer_l3') || "Contact", href: "#" },
    { label: t('footer_l4') || "GitHub", href: "#" },
    { label: t('footer_l5') || "Privacy Policy", href: "#" },
  ];

  return (
    <footer className="py-10 bg-card border-t border-border">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="font-display text-lg font-extrabold text-primary">AgriMate</span>
        <div className="flex flex-wrap gap-6 justify-center">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t('footer_rights') || "© 2026 AgriMate. All rights reserved."}</p>
      </div>
    </footer>
  );
};

export default Footer;
