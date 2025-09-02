import React from "react";
import { IconType } from "react-icons";
import { FiCreditCard, FiMail, FiUser, FiUsers } from "react-icons/fi";
import Card from "./UI/dashboard_card";

const HoverDevCards = () => {
  return (
    <div className="p-4">
      <p className="text-xl font-semibold text-gray-400 mb-2">Actions</p>
      <div className="grid gap-4  grid-cols-2 lg:grid-cols-4">
        <Card
          title="Account"
          subtitle="Manage profile"
          href="/user-profile"
          Icon={FiUser}
        />
        <Card title="Email" subtitle="Manage email" href="#" Icon={FiMail} />
        <Card
          title="Clubs"
          subtitle="Manage Clubs"
          href="/dashboard/joinedclubs"
          Icon={FiUsers}
        />
        <Card
          title="Billing"
          subtitle="Manage cards"
          href=""
          Icon={FiCreditCard}
        />
      </div>
    </div>
  );
};

export default HoverDevCards;
