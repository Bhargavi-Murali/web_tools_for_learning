(() => {
  "use strict";

  const client = window.supabaseClient;
  const indicator = document.getElementById("signedInIndicator");
  const scoresLink = document.getElementById("scoresLink");
  const adminLink = document.getElementById("adminLink");
  const accountLink = document.getElementById("accountLink");

  function displayName(user) {
    const metadata = user?.user_metadata || {};
    return metadata.display_name || metadata.full_name || metadata.name || user?.email?.split("@")[0] || "Learner";
  }

  async function render(session) {
    const user = session?.user;
    indicator.hidden = !user;
    scoresLink.hidden = !user;
    adminLink.hidden = true;
    accountLink.textContent = user ? "Account" : "Sign in";

    if (!user) return;
    indicator.textContent = `Signed in as ${displayName(user)}`;

    const { data, error } = await client.rpc("is_site_admin");
    if (!error && data === true) adminLink.hidden = false;
  }

  if (!client) return;
  client.auth.onAuthStateChange((_event, session) => { void render(session); });
  void client.auth.getSession().then(({ data }) => render(data.session));
})();
