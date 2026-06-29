import nodemailer from "nodemailer";

const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
const emailPort = Number(process.env.EMAIL_PORT || "465");
const emailSecure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === "true" : true;
const emailUser = process.env.EMAIL_USER;
const rawEmailPass = process.env.EMAIL_PASS || "";
const trimmedEmailPass = rawEmailPass.trim();
const emailPass = /^[A-Za-z0-9]{4}( [A-Za-z0-9]{4}){3}$/.test(trimmedEmailPass)
  ? trimmedEmailPass.replace(/\s+/g, "")
  : trimmedEmailPass;
const fromName = process.env.EMAIL_FROM_NAME || "Nawi Saadi Travel Agency";
const fromEmail = process.env.EMAIL_FROM_EMAIL || emailUser;

const transporter = emailUser && emailPass
  ? nodemailer.createTransport({
      service: emailHost === "smtp.gmail.com" ? "gmail" : undefined,
      host: emailHost === "smtp.gmail.com" ? undefined : emailHost,
      port: emailPort,
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      logger: process.env.NODE_ENV !== "production",
      debug: process.env.NODE_ENV !== "production",
    })
  : null;

export const sendTicketEmail = async ({ to, ticket, booking, flight, airline }) => {
  if (!to) return { sent: false, reason: "No email provided" };
  if (!transporter) return { sent: false, reason: "Email transport is not configured" };

  const passenger = ticket.passenger || {};
  const flightInfo = ticket.flightSnapshot || flight || {};
  const airlineInfo = flightInfo.airline || airline || {};
  const route = `${flightInfo.originAirportCode || ""} → ${flightInfo.destinationAirportCode || ""}`;
  const departureDate = flightInfo.departureDate
    ? new Date(flightInfo.departureDate).toDateString()
    : "TBA";
  const arrivalDate = flightInfo.arrivalDate
    ? new Date(flightInfo.arrivalDate).toDateString()
    : "TBA";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your Flight Ticket</h2>
      <p>Dear ${passenger.name || "Passenger"},</p>
      <p>Your booking <strong>${booking.bookingReference}</strong> has been confirmed.</p>
      <hr />
      <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
      <p><strong>Flight:</strong> ${flightInfo.flightNumber || "N/A"} (${airlineInfo.airlineName || airlineInfo.name || "Airline"})</p>
      <p><strong>Route:</strong> ${route}</p>
      <p><strong>Departure:</strong> ${departureDate} at ${flightInfo.departureTime || "TBA"}</p>
      <p><strong>Arrival:</strong> ${arrivalDate} at ${flightInfo.arrivalTime || "TBA"}</p>
      <p><strong>Seat:</strong> ${ticket.seatNumber || ticket.seat || "TBA"} (${ticket.seatClass || "TBA"})</p>
      <p><strong>Passport:</strong> ${passenger.passportNumber || "TBA"}</p>
      <p><strong>Total Paid:</strong> ${booking.currency || ""} ${booking.grandTotal ?? booking.amount ?? "0.00"}</p>
      <hr />
      <p>Please present this ticket and your passport at check-in.</p>
    </div>
  `;

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to,
    subject: `Flight Ticket — ${booking.bookingReference}`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  const accepted = info.accepted || [];
  const rejected = info.rejected || [];
  const sent = accepted.length > 0 && rejected.length === 0;

  if (!sent) {
    console.warn("Email was not accepted by SMTP server", {
      to,
      accepted,
      rejected,
      response: info.response,
      messageId: info.messageId,
    });
  }

  return {
    sent,
    messageId: info.messageId,
    to,
    accepted,
    rejected,
    response: info.response,
  };
};
