import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const sendTicketEmail = async ({ to, ticket, booking, flight, airline }) => {
  if (!to) return { sent: false, reason: "No email provided" };
  if (!resend) return { sent: false, reason: "Resend not configured" };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Flight Ticket</h2>
      <p>Dear ${ticket.passenger.name},</p>
      <p>Your booking <strong>${booking.bookingReference}</strong> has been confirmed.</p>
      <hr />
      <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Flight:</strong> ${flight.flightNumber} (${airline?.airlineName || "Airline"})</p>
      <p><strong>Route:</strong> ${flight.originCity} (${flight.originAirportCode}) → ${flight.destinationCity} (${flight.destinationAirportCode})</p>
      <p><strong>Departure:</strong> ${new Date(flight.departureDate).toDateString()} at ${flight.departureTime}</p>
      <p><strong>Seat:</strong> ${ticket.seatNumber} (${ticket.seatClass})</p>
      <p><strong>Passport:</strong> ${ticket.passenger.passportNumber}</p>
      <p><strong>Total Paid:</strong> ${booking.currency} ${booking.grandTotal}</p>
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

  return { sent: true, id: data?.id };
};
