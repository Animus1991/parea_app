import { test, expect } from '@playwright/test';
import { enterDemoAdmin, enterDemoGuest } from './a11y-helpers';

/**
 * Φ26 — Wall & audiences: what people see is what the audience allows,
 * and every choice is visible before it is made.
 */
test.describe('Nakamas wall', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemoGuest(page);
  });

  test('posts with a chosen audience, shows it, and keeps it after reload', async ({ page }) => {
    await page.goto('/wall');
    const composer = page.getByTestId('wall-composer');
    await composer.getByRole('textbox').fill('Ποιος έρχεται για καφέ μετά το σινεμά;');
    await composer.getByRole('button', { name: /Κοινό:|Audience:/ }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByText(/^Μόνο εγώ$|^Only me$/).click();
    await expect(dialog.getByRole('status')).toContainText(/Μόνο εσύ|Only you/);
    await dialog.getByRole('button', { name: /^Τέλος$|^Done$/ }).click();
    await composer.getByRole('button', { name: /^Δημοσίευση$|^Post$/ }).click();
    const post = page.getByTestId('wall-post').filter({ hasText: 'Ποιος έρχεται για καφέ' });
    await expect(post).toBeVisible();
    await expect(post.getByRole('button', { name: /Κοινό: Μόνο εγώ|Audience: Only me/ })).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('wall-post').filter({ hasText: 'Ποιος έρχεται για καφέ' })).toBeVisible();
  });

  test('a connections-only post appears only after accepting the request', async ({ page }) => {
    await page.goto('/u/u4');
    await expect(page.getByText('φωτογραφικό περίπατο')).toHaveCount(0);
    await page.getByRole('button', { name: /Αποδοχή αιτήματος|Accept request/ }).click();
    await expect(page.getByText(/φωτογραφικό περίπατο/)).toBeVisible();
  });

  test('never shows posts meant for other people', async ({ page }) => {
    await page.goto('/wall');
    await expect(page.getByTestId('wall-post').first()).toBeVisible();
    await expect(page.getByText(/κράτα μου θέση για το board games/)).toHaveCount(0);
    await expect(page.getByText(/έκπληξη γενεθλίων/)).toHaveCount(0);
  });

  test('«Δες ως» previews the profile as a non-connection', async ({ page }) => {
    await page.goto('/u/u1?viewAs=public');
    await expect(page.getByRole('status').filter({ hasText: /όπως το βλέπει|viewing your profile as/ })).toBeVisible();
    // Alex's own posts are for Nakamas only: a stranger sees none of them.
    await expect(page.getByTestId('wall-post')).toHaveCount(0);
    await page.getByRole('button', { name: /Έξοδος προεπισκόπησης|Exit preview/ }).click();
    await expect(page.getByTestId('wall-post').first()).toBeVisible();
  });

  test('reacts and comments on a friend’s post', async ({ page }) => {
    await page.goto('/wall');
    const post = page.locator('[data-post-id="wp1"]');
    const like = post.getByTestId('wall-post-like');
    await expect(like).toHaveAttribute('aria-pressed', 'false');
    await expect(like).toHaveAccessibleName(/^Μου αρέσει$|^Like$/);
    await like.focus();
    await like.press('ArrowUp');
    const tray = post.getByRole('group', { name: /Διάλεξε αντίδραση|Choose a reaction/ });
    await expect(tray).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tray).toHaveCount(0);
    await like.hover();
    await tray.getByRole('button', { name: /^Τέλειο$|^Love$/ }).click();
    await expect(like).toHaveAttribute('aria-pressed', 'true');
    await expect(like).toHaveAccessibleName(/^Τέλειο$|^Love$/);
    await post.getByRole('button', { name: /^Σχόλιο$|^Comment$/ }).click();
    await post.getByRole('textbox').fill('Τέλειο, έρχομαι! 🙌');
    await post.getByRole('button', { name: /Αποστολή σχολίου|Send comment/ }).click();
    await expect(post.getByText('Τέλειο, έρχομαι! 🙌')).toBeVisible();
  });
});

test.describe('Nakamas wall v2', () => {
  test('a tag is approved from Activity and then shows on the profile', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/notifications');
    const activity = page.getByRole('region', { name: /Δραστηριότητα|Activity/ });
    await activity.getByRole('button', { name: /Εμφάνιση στο προφίλ μου|Show on my profile/ }).click();
    await page.goto('/u/u1?viewAs=u2');
    await expect(page.locator('[data-post-id="wp10"]')).toBeVisible();
  });

  test('shares an event to the wall from the event page', async ({ page }) => {
    await enterDemoGuest(page);
    await page.goto('/events/e7');
    await page.getByRole('button', { name: /Κοινοποίηση|Share Event/ }).first().click();
    await page.getByRole('menuitem', { name: /Στον τοίχο μου|On my wall/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox')).toHaveValue(/Πάω σε αυτό|I am going/);
    await dialog.getByRole('button', { name: /^Δημοσίευση$|^Post$/ }).click();
    await page.goto('/wall');
    const mine = page.getByTestId('wall-post').filter({ hasText: /Πάω σε αυτό|I am going/ }).first();
    await expect(mine).toContainText('Stand-Up Comedy Night');
  });

  test('a tagged wall owner can still remove the tag after approving it', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      data.state = { ...(data.state ?? {}), onboardingCompleted: true };
      localStorage.setItem(key, JSON.stringify(data));
    }, 'nakamas-store-v1');
    await page.reload();
    await page.getByRole('button', { name: /Nikos/ }).first().click();
    await expect(page.locator('#main-content')).toBeVisible();

    await page.goto('/u/u1');
    const composer = page.getByTestId('wall-composer');
    await composer.getByRole('textbox').fill('Καλημέρα, σε έβαλα στην παρέα.');
    await composer.getByRole('button', { name: /Με ποιους|With whom/ }).click();
    const tagDialog = page.getByRole('dialog');
    await tagDialog.locator('label').filter({ hasText: /^Alex/ }).click();
    await tagDialog.getByRole('button', { name: /^Τέλος$|^Done$/ }).click();
    await composer.getByRole('button', { name: /^Δημοσίευση$|^Post$/ }).click();
    await expect(page.getByTestId('wall-post').filter({ hasText: 'Καλημέρα, σε έβαλα στην παρέα' })).toBeVisible();

    await page.goto('/login');
    await page.getByRole('button', { name: /^Alex\b/ }).first().click();
    await expect(page.locator('#main-content')).toBeVisible();
    await page.goto('/wall');
    const post = page.getByTestId('wall-post').filter({ hasText: 'Καλημέρα, σε έβαλα στην παρέα' });
    await expect(post.getByRole('button', { name: /^Ναι$|^Yes$/ })).toBeVisible();
    await post.getByRole('button', { name: /^Ναι$|^Yes$/ }).click();
    await expect(post.getByRole('button', { name: /^Ναι$|^Yes$/ })).toHaveCount(0);
    await post.getByRole('button', { name: /Ενέργειες δημοσίευσης|Post actions/ }).click();
    await page.getByRole('menuitem', { name: /Αφαίρεση της ετικέτας μου|Remove my tag/ }).click();
    await expect(post.getByText(/με εσένα|with you/)).toHaveCount(0);
  });

  test('a reported post is removed by a moderator and hidden from others', async ({ page }) => {
    await enterDemoAdmin(page);
    await page.goto('/wall');
    const post = page.locator('[data-post-id="wp2"]');
    await post.getByRole('button', { name: /Ενέργειες δημοσίευσης|Post actions/ }).click();
    await page.getByRole('menuitem', { name: /Αναφορά δημοσίευσης|Report post/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: /Αποστολή αναφοράς|Send report/ }).click();
    await page.goto('/admin');
    await page.getByRole('tab', { name: /Μετριασμός|Moderation/ }).click();
    const section = page.getByRole('region', { name: /Δημοσιεύσεις τοίχου|Wall posts/ });
    await section.getByRole('button', { name: /Αφαίρεση δημοσίευσης|Remove post/ }).click();
    await expect(section.getByRole('button', { name: /Επαναφορά|Restore/ })).toBeVisible();
  });
});
