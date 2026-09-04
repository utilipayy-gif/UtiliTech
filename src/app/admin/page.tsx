import { adminIsConfigured, isAdminAuthenticated } from "@/lib/admin-auth";
import { contentStoreIsConfigured, getServices, getSiteSettings } from "@/lib/content-store";
import Link from "next/link";
import { changePasswordAction, createServiceAction, deleteServiceAction, loginAction, logoutAction, updateServiceAction, updateSettingsAction } from "./actions";
import styles from "./admin.module.css";
import feedback from "./admin-feedback.module.css";
import { servicePrice, type Service } from "../service-data";
import PackageEditor from "./package-editor";
import AdminSubmitButton from "./submit-button";
import AdminToast from "./admin-toast";

const message: Record<string, string> = {
  created: "Service created and published.",
  saved: "Changes published successfully.",
  settings: "Contact and company details published.",
  deleted: "Service removed.",
  password: "Password changed. Sign in with your new password.",
  login: "Email or password is incorrect.",
  session: "Please sign in again.",
  duplicate: "That URL slug is already in use.",
  confirm: "Removal text did not match.",
  invalid: "Please check the highlighted fields and add useful content.",
  save: "We could not publish that change. Please try again.",
  storage: "Neon is not configured yet. Add DATABASE_URL before publishing changes.",
  password_current: "Current password is incorrect.",
  password_match: "New passwords do not match.",
  password_same: "Choose a password different from the current one.",
  password_length: "New password must be between 12 and 128 characters.",
};

function Fields({ service }: { service?: Service }) {
  return <>
    <div className={styles.pair}>
      <label>Service name<input name="title" defaultValue={service?.title} minLength={2} required /></label>
      <label>URL slug<input name="slug" defaultValue={service?.slug} pattern="[a-z0-9-]+" title="Use lowercase letters, numbers and hyphens only." required /></label>
    </div>
    <div className={styles.pair}>
      <label>Category<input name="category" defaultValue={service?.category} minLength={2} required /></label>
      <label>Starting price (₹)<input name="price" type="number" min="0" step="1" defaultValue={service ? servicePrice(service) : 14999} required /></label>
    </div>
    <label>Short description<textarea name="short" rows={2} minLength={10} defaultValue={service?.short} required /></label>
    <label>Detailed introduction<textarea name="intro" rows={5} minLength={20} defaultValue={service?.intro} required /></label>
    <div className={styles.pair}>
      <label>Benefits — one per line<textarea name="benefits" rows={5} defaultValue={service?.benefits.join("\n")} required /></label>
      <label>Deliverables — one per line<textarea name="deliverables" rows={5} defaultValue={service?.deliverables.join("\n")} required /></label>
    </div>
    <PackageEditor initial={service?.packages} />
  </>;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const query = await searchParams;
  const key = String(query.status ?? query.error ?? "");
  const configured = adminIsConfigured();

  if (!(await isAdminAuthenticated())) {
    return <main className={`${styles.shell} ${feedback.validationScope}`}>
      <section className={styles.login}>
        <span>UTILITECH / CONTENT ADMIN</span>
        <h1>Sign in to manage services.</h1>
        {key && <p className={styles.alert}>{message[key]}</p>}
        {!configured && <div className={styles.setup}><strong>Admin setup required</strong><p>Add ADMIN_EMAIL, ADMIN_PASSWORD and a 32+ character ADMIN_SESSION_SECRET to your environment, then restart the website.</p></div>}
        <form action={loginAction}>
          <label>Email<input type="email" name="email" autoComplete="username" required /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
          <AdminSubmitButton disabled={!configured} pendingText="Signing in…">Sign in →</AdminSubmitButton>
        </form>
        <Link href="/">← Back to website</Link>
      </section>
    </main>;
  }

  const services = await getServices();
  const settings = await getSiteSettings();
  const storageReady = contentStoreIsConfigured();
  const toastMessage = key ? message[key] : "";
  const toastTone = typeof query.error === "string" ? "error" : "success";

  return <main className={`${styles.shell} ${feedback.validationScope}`}>
    <header className={styles.header}>
      <div><span>UTILITECH / ADMIN</span><h1>Website content</h1><p>{services.length} live service pages</p></div>
      <div>
        <Link href="/" target="_blank">View website ↗</Link>
        <form action={logoutAction}><AdminSubmitButton pendingText="Signing out…">Log out</AdminSubmitButton></form>
      </div>
    </header>
    {toastMessage && <AdminToast message={toastMessage} tone={toastTone} />}
    {!storageReady && <p className={styles.notice}>{message.storage}</p>}

    <details className={styles.create}>
      <summary>Contact &amp; company details</summary>
      <form action={updateSettingsAction}>
        <div className={styles.pair}>
          <label>Phone<input name="phone" defaultValue={settings.phone} minLength={7} required /></label>
          <label>WhatsApp number (digits only)<input name="whatsapp" defaultValue={settings.whatsapp} pattern="[0-9]{10,15}" title="Enter 10 to 15 digits including the country code." required /></label>
        </div>
        <label>Email<input name="email" type="email" defaultValue={settings.email} required /></label>
        <label>Registered address<textarea name="address" rows={3} minLength={10} defaultValue={settings.address} required /></label>
        <label>Legal company name<input name="legalName" minLength={2} defaultValue={settings.legalName} required /></label>
        <div className={styles.pair}>
          <label>Registration date<input name="registrationDate" defaultValue={settings.registrationDate} required /></label>
          <label>CIN<input name="cin" defaultValue={settings.cin} required /></label>
        </div>
        <label>GST<input name="gst" defaultValue={settings.gst} required /></label>
        <AdminSubmitButton className={styles.primary} pendingText="Saving details…">Save contact details</AdminSubmitButton>
      </form>
    </details>

    <details className={styles.create}>
      <summary>＋ Add a new service</summary>
      <form action={createServiceAction}>
        <Fields />
        <AdminSubmitButton className={styles.primary} pendingText="Creating service…">Create and publish</AdminSubmitButton>
      </form>
    </details>

    <details className={styles.create}>
      <summary>Security / Change password</summary>
      <form action={changePasswordAction}>
        <label>Current password<input type="password" name="currentPassword" autoComplete="current-password" required /></label>
        <div className={styles.pair}>
          <label>New password<input type="password" name="newPassword" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <label>Confirm new password<input type="password" name="confirmPassword" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        </div>
        <p>Your session will end after the password is changed.</p>
        <AdminSubmitButton className={styles.primary} pendingText="Changing password…">Change password</AdminSubmitButton>
      </form>
    </details>

    <section className={styles.list}>
      {services.map((service) => <details className={styles.card} key={service.slug}>
        <summary>
          <div><span>{service.category} · ₹{servicePrice(service).toLocaleString("en-IN")}</span><h2>{service.title}</h2><p>/services/{service.slug}</p></div>
          <b>Edit ↓</b>
        </summary>
        <form action={updateServiceAction} className={styles.edit}>
          <input type="hidden" name="oldSlug" value={service.slug} />
          <Fields service={service} />
          <AdminSubmitButton className={styles.primary} pendingText="Saving changes…">Save changes</AdminSubmitButton>
        </form>
        <form action={deleteServiceAction} className={styles.remove}>
          <input type="hidden" name="slug" value={service.slug} />
          <label>To remove this service, type <strong>{service.slug}</strong><input name="confirm" required /></label>
          <AdminSubmitButton pendingText="Removing…">Remove service</AdminSubmitButton>
        </form>
      </details>)}
    </section>
  </main>;
}
