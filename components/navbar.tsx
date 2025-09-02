"use client";

import CardNav from "./UI/ui_nav";
import logo from "../public/W.png";

const App = () => {
  const items = [
    {
      label: "Dashboard",
      bgColor: "#1a1a1a",
      textColor: "#cacaca",
      links: [
        {
          label: "Dashboard Panel",
          href: "/dashboard",
          ariaLabel: "Dashboard Panel",
        },
        {
          label: "Joined Clubs",
          href: "/dashboard/joinedclubs",
          ariaLabel: "Joined Clubs",
        },
      ],
    },
    {
      label: "Club",
      bgColor: "#2a2a2a",
      textColor: "#cacaca",
      links: [
        {
          label: "Create Club",
          href: "/welcome/create-club",
          ariaLabel: "Create Club",
        },
        {
          label: "Join Club",
          href: "/welcome/join-a-club",
          ariaLabel: "Join Club",
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
      logoAlt="Company Logo"
      items={items}
      baseColor="#000"
      menuColor="#4a4a4a"
      buttonBgColor="#1a1a1a"
      buttonTextColor="#cacaca"
      ease="elastic.out(1,.8)"
    />
  );
};

export default App;
