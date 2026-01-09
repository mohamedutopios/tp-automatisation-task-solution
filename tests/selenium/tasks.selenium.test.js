// Import des classes principales de Selenium WebDriver
// Builder : construit le driver navigateur
// By : permet de localiser des éléments (id, css, xpath…)
// until : conditions d’attente explicites
// Key : permet d’envoyer des touches clavier spéciales
const { Builder, By, until, Key } = require('selenium-webdriver');

// Import du support spécifique pour le navigateur Chrome
const chrome = require('selenium-webdriver/chrome');

// Import du module HTTP natif de Node.js pour lancer un serveur local
const http = require('http');

// Import de l’application Express à tester
const app = require('../../src/app');

// Import du store de tâches (faux stockage en mémoire)
const taskStore = require('../../src/models/taskStore');

// Début du groupe principal de tests Selenium
describe('Tests Selenium - Interface TaskFlow', () => {

  // Variable qui contiendra le driver Selenium (Chrome)
  let driver;

  // Variable qui contiendra le serveur HTTP
  let server;

  // Port utilisé pour lancer l’application pendant les tests
  const PORT = 3001;

  // URL de base utilisée par Selenium pour accéder à l’application
  const BASE_URL = `http://localhost:${PORT}`;

  // Fonction utilitaire pour attendre que la modal d’édition soit visible
  async function waitForModalVisible(timeout = 5000) {

    // Attente explicite Selenium avec une fonction personnalisée
    await driver.wait(async () => {
      try {

        // Recherche de l’overlay de la modal
        const overlay = await driver.findElement(By.id('modalOverlay'));

        // Récupération de la liste des classes CSS de l’overlay
        const classes = await overlay.getAttribute('class');

        // Si la classe "active" n’est pas présente, la modal n’est pas visible
        if (!classes.includes('active')) return false;

        // Recherche de la fenêtre modale
        const modal = await driver.findElement(By.id('editModal'));

        // Vérifie si la modal est réellement affichée à l’écran
        return await modal.isDisplayed();
      } catch (e) {

        // En cas d’erreur (élément non trouvé), on considère que la modal n’est pas visible
        return false;
      }
    }, timeout); // Délai maximal d’attente
  }

  // Fonction utilitaire pour attendre que la modal d’édition soit fermée
  async function waitForModalHidden(timeout = 5000) {

    // Attente explicite Selenium avec condition personnalisée
    await driver.wait(async () => {
      try {

        // Recherche de l’overlay de la modal
        const overlay = await driver.findElement(By.id('modalOverlay'));

        // Récupération des classes CSS
        const classes = await overlay.getAttribute('class');

        // La modal est considérée fermée si la classe "active" n’est plus présente
        return !classes.includes('active');
      } catch (e) {

        // Si l’élément n’existe plus, la modal est considérée fermée
        return true;
      }
    }, timeout); // Délai maximal d’attente
  }

  // Hook exécuté une seule fois avant tous les tests
  beforeAll(async () => {

    // Création d’un serveur HTTP basé sur l’application Express
    server = http.createServer(app);

    // Démarrage du serveur et attente qu’il écoute sur le port
    await new Promise(resolve => server.listen(PORT, resolve));

    // Configuration des options du navigateur Chrome
    const options = new chrome.Options()
      .addArguments('--headless')               // Mode sans interface graphique
      .addArguments('--no-sandbox')             // Désactive le sandbox (CI)
      .addArguments('--disable-dev-shm-usage')  // Évite les erreurs mémoire
      .addArguments('--disable-gpu')             // Désactive l’accélération GPU
      .addArguments('--window-size=1920,1080'); // Taille de la fenêtre

    // Construction du driver Selenium avec Chrome
    driver = await new Builder()
      .forBrowser('chrome')             // Utilisation de Chrome
      .setChromeOptions(options)        // Application des options
      .build();                         // Création du driver
  });

  // Hook exécuté une seule fois après tous les tests
  afterAll(async () => {

    // Fermeture du navigateur Selenium s’il existe
    if (driver) await driver.quit();

    // Arrêt du serveur HTTP s’il existe
    if (server) await new Promise(resolve => server.close(resolve));
  });

  // Hook exécuté avant chaque test individuel
  beforeEach(async () => {

    // Réinitialisation du stockage des tâches
    taskStore.clear();

    // Chargement de la page principale dans le navigateur
    await driver.get(BASE_URL);

    // Attente que le formulaire de création soit présent dans le DOM
    await driver.wait(until.elementLocated(By.id('taskForm')), 5000);

    // Pause courte pour stabiliser l’interface
    await driver.sleep(500);
  });

  // Groupe de tests sur le chargement initial de la page
  describe('Chargement de la page', () => {

    // Test : vérification du titre HTML
    it('devrait afficher le titre de l\'application', async () => {
      const title = await driver.getTitle();     // Récupère le titre de la page
      expect(title).toContain('TaskFlow');       // Vérifie la présence du texte
    });

    // Test : vérification de l’affichage du formulaire
    it('devrait afficher le formulaire de création', async () => {
      const form = await driver.findElement(By.id('taskForm'));
      expect(await form.isDisplayed()).toBe(true);
    });

    // Test : vérification des statistiques initiales
    it('devrait afficher les statistiques à zéro', async () => {
      const totalTasks = await driver.findElement(By.id('totalTasks'));
      expect(await totalTasks.getText()).toBe('0');
    });

    // Test : vérification de l’état vide
    it('devrait afficher l\'état vide', async () => {
      const emptyState = await driver.findElement(By.css('.empty-state'));
      expect(await emptyState.isDisplayed()).toBe(true);
    });
  });

  // Groupe de tests sur la création de tâches
  describe('Création de tâches', () => {

    // Test : création d’une tâche avec uniquement un titre
    it('devrait créer une tâche avec titre seulement', async () => {

      // Récupération du champ titre
      const titleInput = await driver.findElement(By.id('title'));

      // Saisie du titre
      await titleInput.sendKeys('Ma première tâche');

      // Récupération du bouton de soumission
      const submitBtn = await driver.findElement(By.id('submitBtn'));

      // Clic sur le bouton
      await submitBtn.click();

      // Attente de l’apparition de la carte de tâche
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);

      // Pause courte pour le rendu
      await driver.sleep(300);

      // Vérification du titre affiché
      const taskTitle = await driver.findElement(By.css('.task-title'));
      expect(await taskTitle.getText()).toBe('Ma première tâche');
    });

    // Test : création d’une tâche complète
    it('devrait créer une tâche complète', async () => {

      // Saisie du titre
      await driver.findElement(By.id('title')).sendKeys('Tâche complète');

      // Saisie de la description
      await driver.findElement(By.id('description')).sendKeys('Description détaillée');

      // Sélection du champ priorité
      const prioritySelect = await driver.findElement(By.id('priority'));
      await prioritySelect.click();

      // Sélection de la priorité haute
      const highOption = await driver.findElement(By.css('#priority option[value="high"]'));
      await highOption.click();

      // Soumission du formulaire
      await driver.findElement(By.id('submitBtn')).click();

      // Attente de l’affichage de la tâche
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);

      // Pause courte
      await driver.sleep(300);

      // Vérification de la description affichée
      const taskDescription = await driver.findElement(By.css('.task-description'));
      expect(await taskDescription.getText()).toBe('Description détaillée');

      // Vérification de l’indicateur de priorité
      const priorityIndicator = await driver.findElement(By.css('.task-priority.high'));
      expect(await priorityIndicator.isDisplayed()).toBe(true);
    });

    // Test : vérification du reset du formulaire
    it('devrait vider le formulaire après création', async () => {
      const titleInput = await driver.findElement(By.id('title'));
      await titleInput.sendKeys('Test task');
      await driver.findElement(By.id('submitBtn')).click();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(300);
      const inputValue = await titleInput.getAttribute('value');
      expect(inputValue).toBe('');
    });

    // Test : vérification de la mise à jour des statistiques
    it('devrait mettre à jour les statistiques', async () => {
      await driver.findElement(By.id('title')).sendKeys('Task 1');
      await driver.findElement(By.id('submitBtn')).click();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(500);
      const totalTasks = await driver.findElement(By.id('totalTasks'));
      expect(await totalTasks.getText()).toBe('1');
    });
  });

  // Groupe de tests sur l’affichage et le filtrage
  describe('Affichage et filtrage des tâches', () => {

    // Préparation des données avant chaque test
    beforeEach(async () => {

      // Création de trois tâches avec statuts différents
      taskStore.create({ title: 'Tâche en attente', status: 'pending' });
      taskStore.create({ title: 'Tâche en cours', status: 'in-progress' });
      taskStore.create({ title: 'Tâche terminée', status: 'completed' });

      // Rafraîchissement de la page
      await driver.navigate().refresh();

      // Attente de l’affichage des tâches
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);

      // Pause pour stabilité
      await driver.sleep(500);
    });

    // Test : affichage par défaut
    it('devrait afficher toutes les tâches par défaut', async () => {
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(3);
    });

    // Test : filtre "pending"
    it('devrait filtrer par statut "En attente"', async () => {
      const pendingFilter = await driver.findElement(By.css('[data-filter="pending"]'));
      await pendingFilter.click();
      await driver.sleep(500);
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(1);
      const taskTitle = await driver.findElement(By.css('.task-title'));
      expect(await taskTitle.getText()).toBe('Tâche en attente');
    });

    // Test : filtre "in-progress"
    it('devrait filtrer par statut "En cours"', async () => {
      const inProgressFilter = await driver.findElement(By.css('[data-filter="in-progress"]'));
      await inProgressFilter.click();
      await driver.sleep(500);
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(1);
    });

    // Test : filtre "completed"
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

  // Groupe de tests sur la modification de tâches
  describe('Modification de tâches', () => {

    // Préparation avant chaque test
    beforeEach(async () => {
      taskStore.create({ title: 'Tâche à modifier', description: 'Description originale' });
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(500);
    });

    // Test : ouverture de la modal
    it('devrait ouvrir la modal d\'édition', async () => {
      const editBtn = await driver.findElement(By.css('.action-btn.edit'));
      await editBtn.click();
      await waitForModalVisible();
      await driver.sleep(300);
      const titleInput = await driver.findElement(By.id('editTitle'));
      expect(await titleInput.isDisplayed()).toBe(true);
    });

    // Test : pré-remplissage du formulaire
    it('devrait pré-remplir le formulaire d\'édition', async () => {
      await driver.findElement(By.css('.action-btn.edit')).click();
      await waitForModalVisible();
      await driver.sleep(300);
      const titleInput = await driver.findElement(By.id('editTitle'));
      expect(await titleInput.getAttribute('value')).toBe('Tâche à modifier');
      const descInput = await driver.findElement(By.id('editDescription'));
      expect(await descInput.getAttribute('value')).toBe('Description originale');
    });

    // Test : sauvegarde des modifications
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

    // Test : fermeture avec annulation
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

  // Groupe de tests sur la suppression
  describe('Suppression de tâches', () => {

    // Préparation avant chaque test
    beforeEach(async () => {
      taskStore.create({ title: 'Tâche à supprimer' });
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('.task-card')), 5000);
      await driver.sleep(500);
    });

    // Test : suppression confirmée
    it('devrait supprimer une tâche après confirmation', async () => {
      const deleteBtn = await driver.findElement(By.css('.action-btn.delete'));
      await deleteBtn.click();

      // Acceptation de l’alerte de confirmation
      await driver.switchTo().alert().accept();
      await driver.sleep(500);

      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(0);
      const emptyState = await driver.findElement(By.css('.empty-state'));
      expect(await emptyState.isDisplayed()).toBe(true);
    });

    // Test : annulation de la suppression
    it('devrait ne pas supprimer si annulation de la confirmation', async () => {
      const deleteBtn = await driver.findElement(By.css('.action-btn.delete'));
      await deleteBtn.click();
      await driver.switchTo().alert().dismiss();
      await driver.sleep(300);
      const tasks = await driver.findElements(By.css('.task-card'));
      expect(tasks.length).toBe(1);
    });
  });

  // Groupe de tests sur les notifications toast
  describe('Toast notifications', () => {

    // Test : toast de succès
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
