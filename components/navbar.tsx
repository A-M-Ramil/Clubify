"use client";

import CardNav from "./UI/ui_nav";
import logo from "../public/vercel.svg";

const App = () => {
  const items = [
    {
      label: "About",
      bgColor: "#1a1a1a",
      textColor: "#cacaca",
      links: [
        {
          label: "Company",
          href: "/about/company",
          ariaLabel: "About Company",
        },
        {
          label: "Careers",
          href: "/about/careers",
          ariaLabel: "About Careers",
        },
      ],
    },
    {
      label: "Projects",
      bgColor: "#2a2a2a",
      textColor: "#cacaca",
      links: [
        {
          label: "Featured",
          href: "/projects/featured",
          ariaLabel: "Featured Projects",
        },
        {
          label: "Case Studies",
          href: "/projects/case-studies",
          ariaLabel: "Project Case Studies",
        },
      ],
    },
    {
      label: "Contact",
      bgColor: "#3a3a3a",
      textColor: "#cacaca",
      links: [
        {
          label: "Email",
          href: "mailto:info@company.com",
          ariaLabel: "Email us",
        },
        {
          label: "Twitter",
          href: "https://twitter.com/company",
          ariaLabel: "Twitter",
        },
        {
          label: "LinkedIn",
          href: "https://linkedin.com/company/company",
          ariaLabel: "LinkedIn",
        },
      ],
    },
  ];

  return (
    <CardNav
      logo={logo}
      logoAlt="Company Logo"
      items={items}
      baseColor="#0a0a0a"
      menuColor="#4a4a4a"
      buttonBgColor="#1a1a1a"
      buttonTextColor="#cacaca"
      ease="elastic.out(1,.8)"
    />
  );
};

export default App;
