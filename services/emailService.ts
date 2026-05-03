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

*Customer:* ${details.name}
*Phone:* ${details.phone}

*Pickup:* [${details.pickup}](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.pickup)})
*Drop:* [${details.drop}](https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.drop)})

*Vehicle:* ${details.vehicleType}
*Fare:* ${details.estimatedFare || 'Manual Quote'}
*Distance:* ${details.distance || 'N/A'}
*Schedule (IST):* ${scheduleIST}

Please contact the customer if needed.`
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


  const emailContent = {
    sender: { name: "FastPointCab Booking", email: "fastpointcab@gmail.com" },
    to: [{ email: "fastpointcab@gmail.com", name: "FastPointCab Admin" }],
    subject: `Booking Request: ${details.pickup} [ Fare: ${details.estimatedFare || 'N/A'} ]`,
    htmlContent: `
      <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #FDB813; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; color: #0f172a;">New Web Booking</h1>
        </div>

        <div style="padding: 30px;">
          <!-- Estimated Quote Box -->
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Estimated Quote</p>
            <h2 style="margin: 0; font-size: 32px; color: #0f172a;">${details.estimatedFare || 'Calculated on call'}</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #0f172a;">Total distance: <strong>${details.distance || 'Unknown'}</strong></p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Customer</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${details.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Phone</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;"><a href="tel:${details.phone}">${details.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Pickup</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.pickup)}" target="_blank" style="color:#0f172a; text-decoration:underline;">
                  ${details.pickup}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Drop</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.drop)}" target="_blank" style="color:#0f172a; text-decoration:underline;">
                  ${details.drop}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Vehicle Type</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${details.vehicleType}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Schedule (IST)</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">
                ${scheduleIST}
              </td>
            </tr>
          </table>

          <!-- Action Buttons -->
          <div style="margin-top: 30px; text-align: center; display: flex; justify-content: center; gap: 10px;">
            <a href="${waLink}" target="_blank" style="background-color: #25D366; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reply on WhatsApp</a>
            <a href="${tgLink}" target="_blank" style="background-color: #0088cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reply on Telegram</a>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          Sent from Trustyyellowcabs Booking System
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
