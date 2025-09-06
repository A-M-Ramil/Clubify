import * as React from "react";

interface EmailTemplateProps {
  Clubname: string;
}

export function EmailTemplate({ Clubname }: EmailTemplateProps) {
  return (
    <div>
      <h1>Welcome to {Clubname}!</h1>
    </div>
  );
}
