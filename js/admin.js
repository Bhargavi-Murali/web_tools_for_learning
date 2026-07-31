(() => {
  "use strict";
  const client = window.supabaseClient;
  const status = document.getElementById("adminStatus");
  const denied = document.getElementById("adminDenied");
  const table = document.getElementById("usersTableWrap");
  const body = document.getElementById("usersBody");
  const refresh = document.getElementById("refreshUsersButton");

  function cell(text) { const element = document.createElement("td"); element.textContent = text; return element; }
  function date(value) { return value ? new Date(value).toLocaleString() : "Never"; }

  async function load() {
    status.hidden = false; status.textContent = "Loading users…"; denied.hidden = true; table.hidden = true; refresh.hidden = true;
    if (!client) { status.textContent = "Account services are not configured."; return; }
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session?.user) { status.hidden = true; denied.hidden = false; return; }

    const { data, error } = await client.rpc("admin_list_users");
    if (error) { status.hidden = true; denied.hidden = false; return; }
    body.replaceChildren(...data.map(user => {
      const row = document.createElement("tr");
      row.append(cell(user.display_name || "—"), cell(user.email || "—"), cell(date(user.created_at)), cell(date(user.last_sign_in_at)));
      return row;
    }));
    status.hidden = data.length > 0; status.textContent = data.length ? "" : "No users have signed in yet.";
    table.hidden = data.length === 0; refresh.hidden = false;
  }

  refresh.addEventListener("click", load);
  void load();
})();
