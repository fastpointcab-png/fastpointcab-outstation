
export const appendBookingToSheet = async (bookingDetails: any) => {
  const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

  if (!SCRIPT_URL) {
    console.warn('VITE_GOOGLE_SCRIPT_URL not configured. Booking details not saved to sheet.');
    return;
  }

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        ...bookingDetails,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      }),
    });
    return { status: 'sent' };
  } catch (error) {
    console.error('Error saving to Google Sheet:', error);
  }
};
