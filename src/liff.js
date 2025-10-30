import liff from '@line/liff';

const liffId = import.meta.env.VITE_LIFF_ID;

export async function initLiff() {
  // Replace with your actual LIFF ID from LINE Developers Console
  const liffId = import.meta.env.VITE_LIFF_ID || 'YOUR_LIFF_ID_HERE';
  await liff.init({ liffId });
  if (!liff.isLoggedIn()) {
    liff.login();
  }
  return liff;
}
