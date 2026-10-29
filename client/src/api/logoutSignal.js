let intentionalLogoutUntil = 0;

export function markIntentionalLogout(ms = 4000) {
  intentionalLogoutUntil = Date.now() + ms;
}

export function isIntentionalLogout() {
  return Date.now() < intentionalLogoutUntil;
}
