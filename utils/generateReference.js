const randomSegment = (length, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateBookingReference = () => `BK${randomSegment(8)}`;

export const generateTicketNumber = () => `TK${randomSegment(10)}`;
