const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const http = require('http');
const app = require('../../src/app');
const taskStore = require('../../src/models/taskStore');

describe('Tests Selenium - Interface TaskFlow', () => {
  let driver;
  let server;
  const PORT = 3001;
  const BASE_URL = `http://localhost:${PORT}`;

  async function waitForModalVisible(timeout = 5000) {
    await driver.wait(async () => {
      try {
        const overlay = await driver.findElement(By.id('modalOverlay'));
        const classes = await overlay.getAttribute('class');
        if (!classes.includes('active')) return false;
        const modal = await driver.findElement(By.id('editModal'));
        return await modal.isDisplayed();
      } catch (e) {
        return false;
      }
    }, timeout);
  }

  async function waitForModalHidden(timeout = 5000) {
    await driver.wait(async () => {
      try {
        const overlay = await driver.findElement(By.id('modalOverlay'));
        const classes = await overlay.getAttribute('class');
        return !classes.includes('active');
      } catch (e) {
        return true;
      }
    }, timeout);
  }

  beforeAll(async () => {
    server = http.createServer(app);
    await new Promise(resolve => server.listen(PORT, resolve));
    const options = new chrome.Options()
      .addArguments('--headless')
      .addArguments('--no-sandbox')
      .addArguments('--disable-dev-shm-usage')
      .addArguments('--disable-gpu')
      .addArguments('--window-size=1920,1080');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    if (server) await new Promise(resolve => server.close(resolve));
  });

  beforeEach(async () => {
    taskStore.clear();
    await driver.get(BASE_URL);
    await driver.wait(until.elementLocated(By.id('taskForm')), 5000);
    await driver.sleep(500);
  });

  describe('Chargement de la page', () => {
    it('devrait afficher le titre de l\'application', async () => {
      const title = await driver.getTitle();
      expect(title).toContain('TaskFlow');
    });
    it('devrait afficher le formulaire de création', async () => {
      const form = await driver.findElement(By.id('taskForm'));
      expect(await form.isDisplayed()).toBe(true);
    });
    it('devrait afficher les statistiques à zéro', async () => {
      const totalTasks = await driver.findElement(By.id('totalTasks'));
      expect(await totalTasks.getText()).toBe('0');
    });
    it('devrait afficher l\'état vide', async () => {
      const emptyState = await driver.findElement(By.css('.empty-state'));
      expect(await emptyState.isDisplayed()).toBe(true);
    });
  });

  describe('Création de tâches', () => {
    it('devrait créer une tâche avec titre seulement', async () => {
      const titleInput = await driver.findElement(By.id('title'));
      await titleInput.sendKeys('Ma première tâche');
      const submitBtn = await driver.findElement(By.id('submitBtn'));
      await submitBtn.click();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(300);
      const taskTitle = await driver.findElement(By.css('.task-title'));
      expect(await taskTitle.getText()).toBe('Ma première tâche');
    });
    it('devrait créer une tâche complète', async () => {
      await driver.findElement(By.id('title')).sendKeys('Tâche complète');
      await driver.findElement(By.id('description')).sendKeys('Description détaillée');
      const prioritySelect = await driver.findElement(By.id('priority'));
      await prioritySelect.click();
      const highOption = await driver.findElement(By.css('#priority option[value="high"]'));
      await highOption.click();
      await driver.findElement(By.id('submitBtn')).click();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(300);
      const taskDescription = await driver.findElement(By.css('.task-description'));
      expect(await taskDescription.getText()).toBe('Description détaillée');
      const priorityIndicator = await driver.findElement(By.css('.task-priority.high'));
      expect(await priorityIndicator.isDisplayed()).toBe(true);
    });
    it('devrait vider le formulaire après création', async () => {
      const titleInput = await driver.findElement(By.id('title'));
      await titleInput.sendKeys('Test task');
      await driver.findElement(By.id('submitBtn')).click();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(300);
      const inputValue = await titleInput.getAttribute('value');
      expect(inputValue).toBe('');
    });
    it('devrait mettre à jour les statistiques', async () => {
      await driver.findElement(By.id('title')).sendKeys('Task 1');
      await driver.findElement(By.id('submitBtn')).click();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(500);
      const totalTasks = await driver.findElement(By.id('totalTasks'));
      expect(await totalTasks.getText()).toBe('1');
    });
  });

  describe('Affichage et filtrage des tâches', () => {
    beforeEach(async () => {
      taskStore.create({ title: 'Tâche en attente', status: 'pending' });
      taskStore.create({ title: 'Tâche en cours', status: 'in-progress' });
      taskStore.create({ title: 'Tâche terminée', status: 'completed' });
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(500);
    });
    it('devrait afficher toutes les tâches par défaut', async () => {
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(3);
    });
    it('devrait filtrer par statut "En attente"', async () => {
      const pendingFilter = await driver.findElement(By.css('[data-filter="pending"]'));
      await pendingFilter.click();
      await driver.sleep(500);
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(1);
      const taskTitle = await driver.findElement(By.css('.task-title'));
      expect(await taskTitle.getText()).toBe('Tâche en attente');
    });
    it('devrait filtrer par statut "En cours"', async () => {
      const inProgressFilter = await driver.findElement(By.css('[data-filter="in-progress"]'));
      await inProgressFilter.click();
      await driver.sleep(500);
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(1);
    });
    it('devrait filtrer par statut "Terminées"', async () => {
      const completedFilter = await driver.findElement(By.css('[data-filter="completed"]'));
      await completedFilter.click();
      await driver.sleep(500);
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(1);
      const taskTitle = await driver.findElement(By.css('.task-title'));
      expect(await taskTitle.getText()).toBe('Tâche terminée');
    });
  });

  describe('Modification de tâches', () => {
    beforeEach(async () => {
      taskStore.create({ title: 'Tâche à modifier', description: 'Description originale' });
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(500);
    });
    it('devrait ouvrir la modal d\'édition', async () => {
      const editBtn = await driver.findElement(By.css('.action-btn.edit'));
      await editBtn.click();
      await waitForModalVisible();
      await driver.sleep(300);
      const titleInput = await driver.findElement(By.id('editTitle'));
      expect(await titleInput.isDisplayed()).toBe(true);
    });
    it('devrait pré-remplir le formulaire d\'édition', async () => {
      await driver.findElement(By.css('.action-btn.edit')).click();
      await waitForModalVisible();
      await driver.sleep(300);
      const titleInput = await driver.findElement(By.id('editTitle'));
      expect(await titleInput.getAttribute('value')).toBe('Tâche à modifier');
      const descInput = await driver.findElement(By.id('editDescription'));
      expect(await descInput.getAttribute('value')).toBe('Description originale');
    });
    it('devrait sauvegarder les modifications', async () => {
      await driver.findElement(By.css('.action-btn.edit')).click();
      await waitForModalVisible();
      await driver.sleep(300);
      const titleInput = await driver.findElement(By.id('editTitle'));
      await titleInput.clear();
      await titleInput.sendKeys('Tâche modifiée');
      const submitBtn = await driver.findElement(By.css('#editForm .btn-primary'));
      await submitBtn.click();
      await waitForModalHidden();
      await driver.sleep(500);
      const taskTitle = await driver.findElement(By.css('.task-title'));
      expect(await taskTitle.getText()).toBe('Tâche modifiée');
    });
    it('devrait fermer la modal avec le bouton Annuler', async () => {
      await driver.findElement(By.css('.action-btn.edit')).click();
      await waitForModalVisible();
      await driver.sleep(300);
      const cancelBtn = await driver.findElement(By.id('cancelEdit'));
      await cancelBtn.click();
      await waitForModalHidden();
      const overlay = await driver.findElement(By.id('modalOverlay'));
      const classes = await overlay.getAttribute('class');
      expect(classes).not.toContain('active');
    });
  });

  describe('Suppression de tâches', () => {
    beforeEach(async () => {
      taskStore.create({ title: 'Tâche à supprimer' });
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(500);
    });
    it('devrait supprimer une tâche après confirmation', async () => {
      const deleteBtn = await driver.findElement(By.css('.action-btn.delete'));
      await deleteBtn.click();
      await driver.switchTo().alert().accept();
      await driver.sleep(500);
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(0);
      const emptyState = await driver.findElement(By.css('.empty-state'));
      expect(await emptyState.isDisplayed()).toBe(true);
    });
    it('devrait ne pas supprimer si annulation de la confirmation', async () => {
      const deleteBtn = await driver.findElement(By.css('.action-btn.delete'));
      await deleteBtn.click();
      await driver.switchTo().alert().dismiss();
      await driver.sleep(300);
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(1);
    });
  });

  describe('Toast notifications', () => {
    it('devrait afficher un toast de succès après création', async () => {
      await driver.findElement(By.id('title')).sendKeys('Test toast');
      await driver.findElement(By.id('submitBtn')).click();
      await driver.wait(until.elementLocated(By.css('.toast.show')), 5000);
      const toast = await driver.findElement(By.id('toast'));
      const classes = await toast.getAttribute('class');
      expect(classes).toContain('success');
    });
  });
});
