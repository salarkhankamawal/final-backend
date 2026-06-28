import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const sendTicketEmail = async ({ to, ticket, booking, flight, airline }) => {
  if (!to) return { sent: false, reason: "No email provided" };
  if (!resend) return { sent: false, reason: "Resend not configured" };

  const passenger = ticket.passenger || {};
  const flightInfo = ticket.flightSnapshot || flight || {};
  const airlineInfo = flightInfo.airline || airline || {};
  const route = `${flightInfo.originCity || ""} (${flightInfo.originAirportCode || ""}) → ${flightInfo.destinationCity || ""} (${flightInfo.destinationAirportCode || ""})`;
  const departureDate = flightInfo.departureDate ? new Date(flightInfo.departureDate).toDateString() : "TBA";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Flight Ticket</h2>
      <p>Dear ${passenger.name || "Passenger"},</p>
      <p>Your booking <strong>${booking.bookingReference}</strong> has been confirmed.</p>
      <hr />
      <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Flight:</strong> ${flightInfo.flightNumber || "N/A"} (${airlineInfo.airlineName || "Airline"})</p>
      <p><strong>Route:</strong> ${route}</p>
      <p><strong>Departure:</strong> ${departureDate} at ${flightInfo.departureTime || "TBA"}</p>
      <p><strong>Arrival:</strong> ${flightInfo.arrivalDate ? new Date(flightInfo.arrivalDate).toDateString() : "TBA"} at ${flightInfo.arrivalTime || "TBA"}</p>
      <p><strong>Seat:</strong> ${ticket.seatNumber || ticket.seat || "TBA"} (${ticket.seatClass || "TBA"})</p>
      <p><strong>Passport:</strong> ${passenger.passportNumber || "TBA"}</p>
      <p><strong>Total Paid:</strong> ${booking.currency || ""} ${booking.grandTotal ?? booking.amount ?? "0.00"}</p>
      <hr />
      <p>Please present this ticket and your passport at check-in.</p>
    </div>
  `;

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Flight Ticket — ${booking.bookingReference}`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { sent: true, id: data?.id, to };
};
