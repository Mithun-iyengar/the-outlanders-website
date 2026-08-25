/* whatsapp.js
   Centralized WhatsApp booking link builder
*/
const WHATSAPP_NUMBER = "917795167667"; // Official: +91 77951 67667
const WHATSAPP_COMMUNITY = "https://chat.whatsapp.com/GsFyASKtUKoGlFV2lVsAyM";

/**
 * Open WhatsApp with a structured booking message. `item` may include name, location, date.
 */
function openWhatsApp(item){
  try {
    const name = (item && (item.name || item.trek || item.title)) || 'a Trek';
    const location = (item && (item.location || item.place)) || 'Western Ghats';
    const date = (item && item.date) || 'Upcoming Dates';

    const message = `Hello The Outlanders! 👋\n\nI am interested in booking:\n\n🏔️ Trek / Trip: ${name}\n📍 Location: ${location}\n📅 Date: ${date}\n\nPlease share the itinerary, package details, and availability.\n\nThank you!`;

    const base = `https://wa.me/${WHATSAPP_NUMBER}`;
    const url = `${base}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
  } catch(err) {
    console.error('WhatsApp open failed', err);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank', 'noopener');
  }
}

/**
 * Open a plain WhatsApp chat (no prefilled message) with the official number.
 */
function openWhatsAppChat(){
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  window.open(base, '_blank', 'noopener');
}

/**
 * Helper used by BOOK NOW buttons which pass the element (this)
 */
function handleBooking(el){
  if(!el) return;
  const name = el.dataset.name || el.getAttribute('data-name') || '';
  const date = el.dataset.date || el.getAttribute('data-date') || '';
  const location = el.dataset.location || el.getAttribute('data-location') || '';
  openWhatsApp({ name, date, location });
}

/**
 * Open official WhatsApp Community link
 */
function openWhatsAppCommunity(){
  window.open(WHATSAPP_COMMUNITY, '_blank', 'noopener');
}
