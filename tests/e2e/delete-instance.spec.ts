import { test, expect } from '@playwright/test';

test('delete instance 06', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'maria.clara@exemplo.com.br');
  await page.fill('input[name="password"]', '123456');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('**/dashboard');
  
  // Find Instance 06 card
  // We look for text "Instância 06"
  const instanceCard = page.locator('div', { hasText: 'Instância 06' }).first(); // Adjust selector if needed
  // Actually, looking at InstanceCard.tsx, it renders the name.
  // We need to find the specific card that contains "Instância 06".
  // And then find the "Editar" button within it.
  // The "Editar" button opens the modal where the delete button is.
  
  // Let's look for the "Editar" button inside the card
  // Assuming the card structure:
  /*
    <div ...>
      ...
      <h3>Instância 06</h3>
      ...
      <button>Editar</button>
    </div>
  */
  
  // We can use a locator that filters by text
  await expect(page.getByText('Instância 06')).toBeVisible();
  
  // Click "Editar" associated with this instance
  // We can scope it
  const card = page.locator('.rounded-xl', { has: page.getByText('Instância 06') }).first();
  await card.getByRole('button', { name: 'Editar' }).click();

  // Wait for modal
  await expect(page.getByText('Editar Instância')).toBeVisible();

  // Click "Deletar Instância"
  // It might be in "Danger Zone"
  const deleteBtn = page.getByRole('button', { name: 'Deletar Instância' });
  
  // Check if enabled
  await expect(deleteBtn).toBeEnabled();
  
  // Setup dialog handler
  page.on('dialog', dialog => dialog.accept());

  // Click delete
  await deleteBtn.click();

  // Wait for success toast or error toast
  // We expect success now
  const successToast = page.getByText('Instância excluída');
  const errorToast = page.locator('.text-red-400').or(page.getByText('Falha')).or(page.getByText('Erro'));
  
  try {
    await expect(successToast).toBeVisible({ timeout: 10000 });
    console.log('Deletion success toast visible');
  } catch (e) {
    if (await errorToast.isVisible()) {
      const errorText = await errorToast.textContent();
      console.log('Deletion FAILED with error:', errorText);
      throw new Error(`Deletion failed: ${errorText}`);
    }
    console.log('No toast found?');
  }

  // Verify instance is gone
  await page.reload();
  await expect(page.getByText('Instância 06')).not.toBeVisible();
  console.log('Instance 06 is gone from dashboard');
});
