export const daysLeft = (deadline) => {
  console.log("Deadline:", deadline);

  const date =
    typeof deadline === "number" && deadline < 1000000000000
      ? new Date(deadline * 1000)
      : new Date(deadline);

  if (isNaN(date.getTime())) {
    console.error("Invalid deadline date:", deadline);
    return "Invalid date";
  }

  const difference = date.getTime() - Date.now();
  const remainingDays = Math.max(difference / (1000 * 3600 * 24), 0);

  return remainingDays.toFixed(0);
};
