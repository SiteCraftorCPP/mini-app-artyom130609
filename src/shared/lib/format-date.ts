export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateDots = (currentDate: Date) => {
  const day = String(currentDate.getUTCDate()).padStart(2, "0");
  const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
  const year = currentDate.getUTCFullYear();

  return `${day}.${month}.${year}`;
};

export function formatDisplayedDate(input: string | undefined): string {
  if (!input) {
    return "Неизвестно";
  }

  const date = new Date(input);

  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const monthName = months[date.getUTCMonth()];
  const time =
    `${date.getUTCHours()}`.padStart(2, "0") +
    ":" +
    `${date.getUTCMinutes()}`.padStart(2, "0");
  return `${date.getUTCDate()} ${monthName}, ${time}`;
}

export const formatDateString = ({
  dateObj,
  hour,
  minutes,
}: {
  dateObj: Date;
  hour: string;
  minutes: string;
}) => {
  return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1)
    .toString()
    .padStart(
      2,
      "0"
    )}-${dateObj.getDate().toString().padStart(2, "0")}T${hour}:${minutes}:00.000Z`;
};
