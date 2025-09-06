import React from "react";
import { FiCreditCard, FiMail, FiUser, FiUsers } from "react-icons/fi";
import Card from "./UI/dashboard_card";

const HoverDevCards = ({ clubId }: { clubId: string }) => {
  return (
    <div className="pb-4">
      <p className="text-xl font-semibold text-gray-400 mb-2">Actions</p>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card
          title="Members"
          subtitle="Manage members"
          href={`/dashboard/joinedclubs/${clubId}/members`}
          Icon={FiUser}
        />
        <Card
          title="Email"
          subtitle="Send email"
          href={`/dashboard/joinedclubs/${clubId}/email`}
          Icon={FiMail}
        />
        <Card
          title="Department"
          subtitle="Manage department"
          href={`/dashboard/joinedclubs/${clubId}/departments`}
          Icon={FiUsers}
        />
        <Card
          title="Events"
          subtitle="Manage events"
          href={`/dashboard/joinedclubs/${clubId}/events`}
          Icon={FiCreditCard}
        />
      </div>
    </div>
  );
};

export default HoverDevCards;
