import { test, expect } from '@playwright/test';
import { enterDemoAdmin, enterDemoGuest } from './a11y-helpers';

/**
 * Φ27 — group outings: «Η βραδιά μας», door check-in, invites answered
 * without an account, women & non-binary groups, small outings, collections,
 * the vibe quiz, seat hand-over, appeals and the organizer widget.
 */
test.describe('Group outings', () => {
  test('host checks people in at the door and closes check-in', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/night/g-nn1');
    await expect(page.getByRole('heading', { name: /^Η βραδιά μας$|^Our night$/ })).toBeVisible();
    await expect(page.getByTestId('group-code')).toHaveText(/^PAREA-[A-Z2-9]{4}$/);
    const door = page.getByRole('region', { name: /Check-in στην πόρτα|Door check-in/ });
    await door.getByRole('button', { name: /Check-in για Maria|Check in Maria/ }).click();
    await door.getByRole('button', { name: /Check-in για Nikos|Check in Nikos/ }).click();
    await expect(door.getByText(/^3\/4/)).toBeVisible();
    await door.getByRole('button', { name: /Κλείσιμο check-in|Close check-in/ }).click();
    await door.getByRole('alertdialog').getByRole('button', { name: /Κλείσιμο check-in|Close check-in/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /Ήρθαν 3|3 arrived/ })).toBeVisible();
    // Primary Feedback is the Our Night region CTA (toast action is «Ιστορικό» / History).
    const feedback = page.getByRole('region', { name: /Πώς πήγε η βραδιά;|How was the night?/ });
    await expect(feedback.getByRole('button', { name: /^Αξιολόγηση$|^Feedback$/ })).toBeVisible();
  });

  test('a member sees a rotating 6-digit door code', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/night/g-nn3');
    await expect(page.getByTestId('checkin-code')).toHaveText(/\d{3} \d{3}/);
    await expect(page.getByRole('img', { name: /QR εισόδου|Entry QR/ })).toBeVisible();
  });

  test('friends answer an invite without an account; only the host sees names', async ({ page, browser }) => {
    const guest = await browser.newContext();
    const gp = await guest.newPage();
    await gp.goto('/i/inv-nn1');
    await expect(gp).toHaveURL(/\/i\/inv-nn1$/);
    await expect(gp.getByRole('heading', { name: 'Nakamas Nights: Ιστορίες στο τραπέζι', exact: true })).toBeVisible();
    await expect(gp.getByText('Σοφία')).toHaveCount(0);
    await guest.close();

    await enterDemoGuest(page);
    await page.goto('/i/inv-nn1');
    await page.getByRole('button', { name: /^Ίσως$|^Maybe$/ }).click();
    await page.getByLabel(/Το όνομά σου|Your name/).fill('Δήμητρα');
    await page.getByRole('button', { name: /Στείλε απάντηση|Send answer/ }).click();
    await expect(page.getByRole('status').filter({ hasText: /στάλθηκε|was sent/ })).toBeVisible();
    await page.goto('/night/g-nn1');
    await expect(page.getByText(/Δήμητρα · ίσως|Δήμητρα · maybe/)).toBeVisible();
  });

  test('women & non-binary groups open after the profile says so', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/events/nn2/join?groupId=g-nn2');
    await expect(page.getByText(/μόνο για γυναίκες και μη δυαδικά|women and non-binary people only/)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Συνέχεια$|^Continue$/ })).toBeDisabled();
    await page.goto('/profile');
    const gender = page.getByLabel(/Ταυτότητα φύλου|Gender identity/);
    await gender.click();
    await page.getByRole('option', { name: /Μη δυαδικό άτομο|Non-binary/ }).click();
    await page.goto('/events/nn2/join?groupId=g-nn2');
    await expect(page.getByRole('button', { name: /^Συνέχεια$|^Continue$/ })).toBeEnabled();
  });

  test('creates a small outing from Find Nakamas', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/buddy-seek');
    await page.getByRole('button', { name: /Νέα μικρή έξοδος|New small outing/ }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Βόλτα$|^Walk$/ }).click();
    await dialog.getByLabel(/Περιοχή|Area/).fill('Παγκράτι');
    await dialog.getByRole('button', { name: /^Δημοσίευση$|^Publish$/ }).click();
    await expect(page).toHaveURL(/\/night\/g-mo/);
    await expect(page.getByText(/Βόλτα · Παγκράτι|Walk · Παγκράτι/).first()).toBeVisible();
  });

  test('collections show events and forming groups', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/collections/nakamas-nights');
    await expect(page.getByRole('heading', { name: 'Nakamas Nights', exact: true })).toBeVisible();
    await expect(page.getByText(/3 εκδηλώσεις · \d+ παρέες σχηματίζονται|3 events · \d+ groups forming/)).toBeVisible();
  });

  test('the vibe quiz saves five answers', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/profile');
    await page.getByRole('button', { name: /Κάνε το κουίζ|Take the quiz/ }).click();
    const dialog = page.getByRole('dialog');
    for (let i = 0; i < 4; i++) {
      await dialog.locator('fieldset button').first().click();
      await dialog.getByRole('button', { name: /^Επόμενη$|^Next$/ }).click();
    }
    await dialog.locator('fieldset button').last().click();
    await dialog.getByRole('button', { name: /^Αποθήκευση$|^Save$/ }).click();
    await expect(page.getByRole('button', { name: /Αλλαγή απαντήσεων|Change answers/ })).toBeVisible();
  });

  test('leaving a full group hands the seat to the waitlist', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/night/g-nn3');
    await expect(page.getByText(/θέση σου θα περάσει στο πρώτο άτομο|seat will pass to the first person/)).toBeVisible();
    await page.getByRole('button', { name: /Αποχώρηση από την ομάδα|Leave the group/ }).click();
    await page.getByRole('button', { name: /Ναι, αποχώρηση|Yes, leave/ }).click();
    await expect(page).toHaveURL(/\/plans$/);
    await page.goto('/night/g-nn3');
    await expect(page.getByText(/για τα μέλη της ομάδας|for group members/)).toBeVisible();
    await page.goto('/trust');
    await expect(page.getByTestId('standing-level')).toHaveText(/Όλα καλά|All good/);
  });

  test('a moderator upholds an appeal', async ({ page }) => {
    await enterDemoAdmin(page);
    await page.goto('/admin');
    await page.getByRole('tab', { name: /Μετριασμός|Moderation/ }).click();
    const appeals = page.getByRole('region', { name: /Ενστάσεις για απουσίες|Appeals for absences/ });
    await expect(appeals.getByText(/Είχα πυρετό/)).toBeVisible();
    await appeals.getByRole('button', { name: /^Αποδοχή$|^Uphold$/ }).click();
    await expect(appeals.getByText(/Καμία ένσταση σε αναμονή|No pending appeals/)).toBeVisible();
  });

  test('the organizer widget works signed out', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/embed/organizer/platform');
    await expect(page).toHaveURL(/\/embed\/organizer\/platform$/);
    await expect(page.getByText(/Nakamas Nights: Ιστορίες στο τραπέζι/)).toBeVisible();
    await expect(page.getByText(/Παρέα σχηματίζεται|Group forming/).first()).toBeVisible();
    await ctx.close();
  });

  test('selfie check keeps only the result', async ({ page }) => {
    // No camera in CI: make getUserMedia fail fast so the demo path is deterministic.
    await page.addInitScript(() => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('No camera', 'NotFoundError'));
      }
    });
    await enterDemoGuest(page);
    await page.goto('/verification');
    const card = page.getByRole('region', { name: /Selfie επαλήθευση|Selfie check/ });
    await card.getByRole('button', { name: /Ξεκίνα|Start/ }).click();
    await card.getByRole('button', { name: /Ολοκλήρωση \(demo\)|Finish \(demo\)/ }).click();
    await expect(card.getByText(/Επαληθεύτηκε στις|Verified on/)).toBeVisible();
  });
});
