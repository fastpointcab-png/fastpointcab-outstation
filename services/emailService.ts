import { BookingDetails } from '../types';

export const sendBookingEmail = async (details: BookingDetails): Promise<boolean> => {
  const apiKey = import.meta.env.VITE_BREVO_API_KEY;

  if (!apiKey) {
    console.error("API configuration is missing. Please ensure the environment is correctly set up.");
    return false;
  }

  const url = "https://api.brevo.com/v3/smtp/email";

  // Format schedule in 12-hour IST
  const scheduleIST = new Date(details.date + ' ' + details.time).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Telegram message (clean & spaced)
const tgMessage = encodeURIComponent(
`🚖 *New Booking Request*

📱 *Phone:* ${details.phone}

📍 *Pickup:* [${details.pickup}](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.pickup)})
📍 *Drop:* [${details.drop}](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.drop)})

🚗 *Vehicle:* ${details.vehicleType}

🔁 *Trip Type:* ${details.tripType}
${details.tripType === "Local" ? ` *Package:* ${details.localPackage || "N/A"}` : ""}

*Date:* ${details.date || "N/A"}
*Time:* ${details.time || "N/A"}

*Days:* ${details.numberOfDays || "1"}
*Waiting Hours:* ${details.waitingHours || "0"}

*Hill Station:* ${details.isHillStation ? "Yes (Extra Charge)" : "No"}

*Distance:* ${details.distance || "N/A"}
*Fare:* ${details.estimatedFare || "Manual Quote"}

*Schedule (IST):* ${scheduleIST}

Please contact the customer if needed.
`
);
  const tgLink = `https://t.me/share/url?url=&text=${tgMessage}`;

  // WhatsApp message
const rawPhone = details.phone.replace(/\D/g, '');

// Ensure India country code
const phoneWithCountryCode = rawPhone.startsWith('91')
  ? rawPhone
  : `91${rawPhone}`;

const waMessage = encodeURIComponent(
`👋 Hi / வணக்கம்!

🚖 *FastPointCab* — Your Ride Partner

📍 Need a taxi anytime?
Just open:
👉 https://www.fastpointcab.in/

📲 Easy to book:
Add this website to your Home Screen.
Next time — book in just one tap 👍

🛡️ Safe • On-time • Easy Booking

Whenever you need a ride,
we are just one tap away`
);

const waLink = `https://wa.me/${phoneWithCountryCode}?text=${waMessage}`;


  const isLead = details.isLead === true;
  const subjectPrefix = isLead ? "⚠️ ABANDONED LEAD: " : " NEW BOOKING: ";

  const emailContent = {
  sender: { name: "FastPointCab Booking", email: "fastpointcab@gmail.com" },
  to: [{ email: "fastpointcab@gmail.com", name: "FastPointCab Admin" }],

  subject: `${subjectPrefix}${details.phone} - ${details.pickup} [${details.estimatedFare || 'Quote'}]`,

  htmlContent: `
  <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">

    ${isLead ? `
    <div style="background-color: #fef2f2; padding: 12px; text-align: center; border-bottom: 1px solid #fee2e2;">
      <p style="margin: 0; color: #dc2626; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        ⚠️ System Alert: Abandoned Process
      </p>
    </div>
    ` : `
    <div style="background-color: #f0fdf4; padding: 12px; text-align: center; border-bottom: 1px solid #dcfce7;">
      <p style="margin: 0; color: #16a34a; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        ✅ Confirmed Web Booking
      </p>
    </div>
    `}

    <div style="padding: 30px;">

      <!-- Quote Box -->
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
          Estimated Quote
        </p>

        <h2 style="margin: 0; font-size: 32px; color: #0f172a;">
          ${details.estimatedFare || "Calculated on call"}
        </h2>

        <p style="margin: 5px 0 0 0; font-size: 14px; color: #0f172a;">
          Total distance: <strong>${details.distance || "Unknown"}</strong>
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">

        <!-- Customer -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Customer</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            Web Booking
          </td>
        </tr>

        <!-- Phone -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Phone</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            <a href="tel:${details.phone}">${details.phone}</a>
          </td>
        </tr>

        <!-- Pickup -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Pickup</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.pickup)}" target="_blank">
              ${details.pickup}
            </a>
          </td>
        </tr>

        <!-- Drop -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Drop</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.drop)}" target="_blank">
              ${details.drop}
            </a>
          </td>
        </tr>

        <!-- Vehicle -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Vehicle Type</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            ${details.vehicleType}
          </td>
        </tr>

        <!-- Trip Type -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Trip Type</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            ${details.tripType}
            ${
              details.tripType === "Local"
                ? ` (Package: ${details.localPackage || "N/A"})`
                : ""
            }
          </td>
        </tr>

        <!-- Days -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Days</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            ${details.numberOfDays || "1"}
          </td>
        </tr>

       

        <!-- Schedule -->
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Schedule (IST)</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
            ${scheduleIST}
          </td>
        </tr>

      </table>

      <!-- Buttons -->
      <div style="margin-top: 30px; text-align: center; display: flex; justify-content: center; gap: 10px;">
        <a href="${waLink}" target="_blank"
          style="background-color: #25D366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          WhatsApp Reply
        </a>

        <a href="${tgLink}" target="_blank"
          style="background-color: #0088cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Telegram Reply
        </a>
      </div>

    </div>

    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
      Sent from FastPointCab Booking System
    </div>

  </div>
`
};
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailContent)
    });

    return response.ok;
  } catch (error) {
    console.error("Network error during booking processing:", error);
    return false;
  }
};
