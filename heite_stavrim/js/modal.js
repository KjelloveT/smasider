// Heite Stavrim — Kategori-modal og Escape-handtering

HeiteStavrimGame.prototype.openCustomModal = function () {
    const list = HeiteStavrimStorage.getCustomCategories();
    this.el.customEditor.value = list.join('\n');
    Vy.openModal(this.el.customModal);
    // Flytt fokus inn i modalen for tilgjenge
    this.el.customEditor.focus();
};

HeiteStavrimGame.prototype.closeCustomModal = function () {
    Vy.closeModal(this.el.customModal);
};

HeiteStavrimGame.prototype.saveCustomCategories = function () {
    const text = this.el.customEditor.value.trim();
    const list = text.split('\n').map(s => s.trim()).filter(Boolean);
    HeiteStavrimStorage.saveCustomCategories(list);
    this.populateCustomCategoriesSelect();
    this.closeCustomModal();
};

HeiteStavrimGame.prototype.isCustomModalOpen = function () {
    return Vy.modalOpen(this.el.customModal);
};
