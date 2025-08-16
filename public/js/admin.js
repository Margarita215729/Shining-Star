// Admin panel functionality for Shining Star Cleaning Services

document.addEventListener('DOMContentLoaded', function () {
    // Initialize based on current page
    const currentPage = document.body.dataset.page || getPageFromURL();

    switch (currentPage) {
        case 'login':
            initLoginPage();
            break;
        case 'dashboard':
            initDashboard();
            break;
        case 'portfolio':
            initPortfolioManagement();
            break;
        case 'services':
            initServicesManagement();
            break;
        case 'packages':
            initPackagesManagement();
            break;
    }

    // Initialize common admin functionality
    initAdminCommon();
});

function getPageFromURL() {
    const path = window.location.pathname;
    if (path.includes('/admin/login')) return 'login';
    if (path.includes('/admin/portfolio')) return 'portfolio';
    if (path.includes('/admin/services')) return 'services';
    if (path.includes('/admin/packages')) return 'packages';
    if (path.includes('/admin')) return 'dashboard';
    return 'unknown';
}

// Common Admin Functionality
function initAdminCommon() {
    // Initialize sidebar navigation
    initSidebarNav();

    // Initialize admin notifications
    initAdminNotifications();
}

function initSidebarNav() {
    const sidebarLinks = document.querySelectorAll('.admin-menu a');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Add loading state for navigation
            if (!link.href.includes('#')) {
                window.ShiningStarUtils.showGlobalLoading();
            }
        });
    });
}

function initAdminNotifications() {
    // This could be expanded to include real-time notifications
    console.log('Admin notifications initialized');
}

// Login Page
function initLoginPage() {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitLogin();
        });

        // Store original button text
        const submitButton = loginForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.dataset.originalText = submitButton.innerHTML;
        }
    }
}

async function submitLogin() {
    const form = document.getElementById('login-form');
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');

    // Show loading state
    window.ShiningStarUtils.setButtonLoading(submitButton, true);

    try {
        const response = await fetch('/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password')
            })
        });

        const result = await response.json();

        if (result.success) {
            // Redirect to admin dashboard
            window.location.href = result.redirect || '/admin';
        } else {
            showLoginError(result.message || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Login failed. Please try again.');
    } finally {
        window.ShiningStarUtils.setButtonLoading(submitButton, false);
    }
}

function showLoginError(message) {
    const messagesContainer = document.getElementById('login-messages');
    const errorMessage = document.getElementById('login-error');

    if (messagesContainer && errorMessage) {
        errorMessage.querySelector('span').textContent = message;
        messagesContainer.style.display = 'block';
        errorMessage.style.display = 'flex';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messagesContainer.style.display = 'none';
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

// Dashboard
function initDashboard() {
    // Initialize dashboard widgets
    initDashboardStats();
    initQuickActions();
    initRecentActivity();
}

function initDashboardStats() {
    // Animate stat numbers
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        animateNumber(stat, 0, finalValue, 1000);
    });
}

function initQuickActions() {
    const actionCards = document.querySelectorAll('.action-card');

    actionCards.forEach(card => {
        card.addEventListener('click', function (e) {
            if (!this.href.includes('#')) {
                window.ShiningStarUtils.showGlobalLoading();
            }
        });
    });
}

function initRecentActivity() {
    // This could be expanded to load real activity data
    console.log('Recent activity initialized');
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }

    requestAnimationFrame(updateNumber);
}

// Portfolio Management
function initPortfolioManagement() {
    initAddPortfolioModal();
    initPortfolioActions();
}

function initAddPortfolioModal() {
    const addPortfolioForm = document.getElementById('add-portfolio-form');

    if (addPortfolioForm) {
        addPortfolioForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitPortfolioItem();
        });
    }
}

function openAddPortfolioModal() {
    const modal = document.getElementById('add-portfolio-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeAddPortfolioModal() {
    const modal = document.getElementById('add-portfolio-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Reset form
        const form = document.getElementById('add-portfolio-form');
        if (form) {
            form.reset();
        }
    }
}

async function submitPortfolioItem() {
    const form = document.getElementById('add-portfolio-form');
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');

    // Add title and description objects
    const title = {
        en: document.getElementById('title-en').value,
        ru: document.getElementById('title-ru').value,
        es: document.getElementById('title-es').value
    };

    const description = {
        en: document.getElementById('description-en').value,
        ru: document.getElementById('description-ru').value,
        es: document.getElementById('description-es').value
    };

    formData.append('title', JSON.stringify(title));
    formData.append('description', JSON.stringify(description));

    // Show loading state
    window.ShiningStarUtils.setButtonLoading(submitButton, true);

    try {
        const response = await fetch('/admin/portfolio', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Portfolio item added successfully!');
            closeAddPortfolioModal();
            window.location.reload(); // Refresh to show new item
        } else {
            alert(result.message || 'Error adding portfolio item');
        }
    } catch (error) {
        console.error('Portfolio add error:', error);
        alert('Error adding portfolio item. Please try again.');
    } finally {
        window.ShiningStarUtils.setButtonLoading(submitButton, false);
    }
}

function initPortfolioActions() {
    // Initialize edit and delete buttons
    const editButtons = document.querySelectorAll('[onclick^="editPortfolioItem"]');
    const deleteButtons = document.querySelectorAll('[onclick^="deletePortfolioItem"]');

    // Note: These are placeholder functions - full implementation would require
    // additional forms and API endpoints
}

function editPortfolioItem(itemId) {
    alert(`Edit portfolio item: ${itemId} (Feature to be implemented)`);
}

function deletePortfolioItem(itemId) {
    if (confirm('Are you sure you want to delete this portfolio item?')) {
        alert(`Delete portfolio item: ${itemId} (Feature to be implemented)`);
    }
}

// Services Management
function initServicesManagement() {
    // Fetch initial data from JSON script if present
    function getJsonFromScript(id) {
        const el = document.getElementById(id);
        try { return el ? JSON.parse(el.textContent) : []; } catch { return []; }
    }
    window.AdminData = window.AdminData || {};
    if (!window.AdminData.services) window.AdminData.services = getJsonFromScript('services-data');
    const addBtn = document.getElementById('btn-add-service');
    const modal = document.getElementById('service-modal');
    const closeBtn = document.getElementById('service-modal-close');
    const cancelBtn = document.getElementById('service-cancel');
    const saveBtn = document.getElementById('service-save');
    const table = document.getElementById('services-table');

    function openModal(title) {
        document.getElementById('service-modal-title').textContent = title;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('service-form').reset();
        document.getElementById('service-id').value = '';
    }
    function fillForm(service) {
        document.getElementById('service-id').value = service.id || '';
        document.getElementById('service-name-en').value = (service.name && service.name.en) || '';
        document.getElementById('service-name-ru').value = (service.name && service.name.ru) || '';
        document.getElementById('service-name-es').value = (service.name && service.name.es) || '';
        document.getElementById('service-category').value = service.category || '';
        document.getElementById('service-price').value = service.price || '';
        document.getElementById('service-duration').value = service.duration || '';
        document.getElementById('service-available').value = String(service.available !== false);
        document.getElementById('service-calculationType').value = service.calculationType || 'fixed';
        document.getElementById('service-unit').value = service.unit || '';
        document.getElementById('service-maxQuantity').value = service.maxQuantity != null ? service.maxQuantity : '';
        document.getElementById('service-minArea').value = service.minArea != null ? service.minArea : '';
        document.getElementById('service-maxArea').value = service.maxArea != null ? service.maxArea : '';
        document.getElementById('service-description-en').value = (service.description && service.description.en) || '';
        document.getElementById('service-description-ru').value = (service.description && service.description.ru) || '';
        document.getElementById('service-description-es').value = (service.description && service.description.es) || '';
    }
    function getFormPayload() {
        const payload = {
            name: {
                en: document.getElementById('service-name-en').value.trim(),
                ru: document.getElementById('service-name-ru').value.trim(),
                es: document.getElementById('service-name-es').value.trim(),
            },
            description: {
                en: document.getElementById('service-description-en').value.trim(),
                ru: document.getElementById('service-description-ru').value.trim(),
                es: document.getElementById('service-description-es').value.trim(),
            },
            category: document.getElementById('service-category').value.trim(),
            price: parseFloat(document.getElementById('service-price').value),
            duration: parseInt(document.getElementById('service-duration').value, 10),
            available: document.getElementById('service-available').value === 'true',
            calculationType: document.getElementById('service-calculationType').value,
            unit: document.getElementById('service-unit').value.trim() || null,
        };
        const maxQ = document.getElementById('service-maxQuantity').value;
        const minA = document.getElementById('service-minArea').value;
        const maxA = document.getElementById('service-maxArea').value;
        if (maxQ) payload.maxQuantity = parseInt(maxQ, 10);
        if (minA) payload.minArea = parseFloat(minA);
        if (maxA) payload.maxArea = parseFloat(maxA);
        return payload;
    }

    addBtn && addBtn.addEventListener('click', () => {
        openModal('Add Service');
    });
    closeBtn && closeBtn.addEventListener('click', closeModal);
    cancelBtn && cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

    table && table.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.action === 'edit') {
            const row = btn.closest('tr');
            const service = (window.AdminData && window.AdminData.services || []).find(s => s.id === id);
            if (service) {
                fillForm(service);
                openModal('Edit Service');
            }
        } else if (btn.dataset.action === 'delete') {
            if (confirm('Delete this service? It will be removed from all packages.')) {
                fetch(`/admin/services/${id}`, { method: 'DELETE' })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            showAdminNotification('Service deleted', 'success');
                            window.location.reload();
                        } else {
                            alert((res.errors && res.errors.join(', ')) || 'Failed to delete');
                        }
                    })
                    .catch(() => alert('Failed to delete'));
            }
        }
    });

    saveBtn && saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = document.getElementById('service-id').value;
        const payload = getFormPayload();

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/admin/services/${encodeURIComponent(id)}` : '/admin/services';

        try {
            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const res = await resp.json();
            if (res.success) {
                showAdminNotification('Service saved', 'success');
                closeModal();
                window.location.reload();
            } else {
                alert((res.errors && res.errors.join('\n')) || 'Failed to save');
            }
        } catch (err) {
            alert('Failed to save service');
        }
    });
}

// Packages Management
function initPackagesManagement() {
    const addBtn = document.getElementById('btn-add-package');
    const modal = document.getElementById('package-modal');
    const closeBtn = document.getElementById('package-modal-close');
    const cancelBtn = document.getElementById('package-cancel');
    const saveBtn = document.getElementById('package-save');
    const table = document.getElementById('packages-table');

    // Fetch initial data from JSON script tags
    function getJsonFromScript(id) {
        const el = document.getElementById(id);
        try { return el ? JSON.parse(el.textContent) : []; } catch { return []; }
    }
    window.AdminData = window.AdminData || {};
    if (!window.AdminData.packages) window.AdminData.packages = getJsonFromScript('packages-data');
    if (!window.AdminData.services) window.AdminData.services = getJsonFromScript('services-data');

    function openModal(title) {
        document.getElementById('package-modal-title').textContent = title;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        document.getElementById('package-form').reset();
        document.getElementById('package-id').value = '';
        // Uncheck all services
        document.querySelectorAll('#package-services input[type="checkbox"]').forEach(cb => cb.checked = false);
    }
    function fillForm(pkg) {
        document.getElementById('package-id').value = pkg.id || '';
        document.getElementById('package-name-en').value = (pkg.name && pkg.name.en) || '';
        document.getElementById('package-name-ru').value = (pkg.name && pkg.name.ru) || '';
        document.getElementById('package-name-es').value = (pkg.name && pkg.name.es) || '';
        document.getElementById('package-price').value = pkg.price || '';
        document.getElementById('package-discount').value = pkg.discount || 0;
        document.getElementById('package-duration').value = pkg.duration || '';
        document.getElementById('package-available').value = String(pkg.available !== false);
        document.getElementById('package-description-en').value = (pkg.description && pkg.description.en) || '';
        document.getElementById('package-description-ru').value = (pkg.description && pkg.description.ru) || '';
        document.getElementById('package-description-es').value = (pkg.description && pkg.description.es) || '';
        // services
        const selected = new Set(pkg.services || []);
        document.querySelectorAll('#package-services input[type="checkbox"]').forEach(cb => cb.checked = selected.has(cb.value));
    }
    function getFormPayload() {
        const services = Array.from(document.querySelectorAll('#package-services input[type="checkbox"]:checked')).map(cb => cb.value);
        return {
            name: {
                en: document.getElementById('package-name-en').value.trim(),
                ru: document.getElementById('package-name-ru').value.trim(),
                es: document.getElementById('package-name-es').value.trim(),
            },
            description: {
                en: document.getElementById('package-description-en').value.trim(),
                ru: document.getElementById('package-description-ru').value.trim(),
                es: document.getElementById('package-description-es').value.trim(),
            },
            services,
            price: parseFloat(document.getElementById('package-price').value),
            discount: parseFloat(document.getElementById('package-discount').value || '0'),
            duration: parseInt(document.getElementById('package-duration').value, 10),
            available: document.getElementById('package-available').value === 'true',
        };
    }

    addBtn && addBtn.addEventListener('click', () => openModal('Add Package'));
    closeBtn && closeBtn.addEventListener('click', closeModal);
    cancelBtn && cancelBtn.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

    table && table.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.action === 'edit') {
            const pkg = (window.AdminData && window.AdminData.packages || []).find(p => p.id === id);
            if (pkg) {
                fillForm(pkg);
                openModal('Edit Package');
            }
        } else if (btn.dataset.action === 'delete') {
            if (confirm('Delete this package?')) {
                fetch(`/admin/packages/${id}`, { method: 'DELETE' })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            showAdminNotification('Package deleted', 'success');
                            window.location.reload();
                        } else {
                            alert((res.errors && res.errors.join(', ')) || 'Failed to delete');
                        }
                    })
                    .catch(() => alert('Failed to delete'));
            }
        }
    });

    saveBtn && saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = document.getElementById('package-id').value;
        const payload = getFormPayload();
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/admin/packages/${encodeURIComponent(id)}` : '/admin/packages';
        try {
            const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const res = await resp.json();
            if (res.success) {
                showAdminNotification('Package saved', 'success');
                closeModal();
                window.location.reload();
            } else {
                alert((res.errors && res.errors.join('\n')) || 'Failed to save');
            }
        } catch (err) {
            alert('Failed to save package');
        }
    });
}

// Utility Functions for Admin
function showAdminNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('admin-notification');

    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'admin-notification';
        notification.className = 'admin-notification';
        document.body.appendChild(notification);
    }

    // Set notification content and type
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="hideAdminNotification()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Show notification
    notification.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideAdminNotification();
    }, 5000);
}

function hideAdminNotification() {
    const notification = document.getElementById('admin-notification');
    if (notification) {
        notification.style.display = 'none';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// File upload helpers
function handleFileUpload(input, callback) {
    const file = input.files[0];

    if (file) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, or GIF)');
            input.value = '';
            return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes

        if (file.size > maxSize) {
            alert('File size must be less than 5MB');
            input.value = '';
            return;
        }

        // Create preview if callback provided
        if (callback) {
            const reader = new FileReader();
            reader.onload = function (e) {
                callback(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }
}

// Data table helpers (for future use)
function sortTable(table, columnIndex, ascending = true) {
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);

    rows.sort((a, b) => {
        const aValue = a.cells[columnIndex].textContent.trim();
        const bValue = b.cells[columnIndex].textContent.trim();

        if (ascending) {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });

    rows.forEach(row => tbody.appendChild(row));
}

function filterTable(table, searchTerm) {
    const tbody = table.tBodies[0];
    const rows = tbody.rows;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();

        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    }
}

// Export functions for global access
window.AdminPanel = {
    openAddPortfolioModal,
    closeAddPortfolioModal,
    editPortfolioItem,
    deletePortfolioItem,
    showAdminNotification,
    hideAdminNotification,
    handleFileUpload,
    sortTable,
    filterTable
};