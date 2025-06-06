// DOM Elements
const bugForm = document.getElementById('bug-form');
const bugList = document.getElementById('bug-list');
const toast = document.getElementById('toast');
const toastContent = document.getElementById('toast-content');
const toastClose = document.getElementById('toast-close');
const searchInput = document.getElementById('search');
const filterSelect = document.getElementById('filter');
const itemsPerPageSelect = document.getElementById('items-per-page');
const pagination = document.getElementById('pagination');
const themeToggle = document.getElementById('theme-toggle');
const floatingActionBtn = document.getElementById('floating-action-btn');
const formToggleBtn = document.getElementById('form-toggle');
const formContent = document.querySelector('.form-content');
const clearFormBtn = document.getElementById('clear-form');
const statsTotal = document.getElementById('stats-total');
const statsOpen = document.getElementById('stats-open');

// State
let bugs = JSON.parse(localStorage.getItem('bugs')) || [];
let currentPage = 1;
let itemsPerPage = parseInt(localStorage.getItem('itemsPerPage')) || 5;
let currentFilter = 'all';
let searchQuery = '';

// Initialize the app
function init() {
    setupEventListeners();
    loadTheme();
    renderBugs();
    updatePagination();
    updateStats();
}

// Set up event listeners
function setupEventListeners() {
    // Form submission
    bugForm.addEventListener('submit', handleSubmit);
    
    // Search and filter
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        currentPage = 1;
        renderBugs();
        updatePagination();
    });
    
    filterSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        renderBugs();
        updatePagination();
    });
    
    // Pagination
    itemsPerPageSelect.value = itemsPerPage;
    itemsPerPageSelect.addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        localStorage.setItem('itemsPerPage', itemsPerPage);
        currentPage = 1;
        renderBugs();
        updatePagination();
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Form toggle
    formToggleBtn.addEventListener('click', () => {
        formContent.style.display = formContent.style.display === 'none' ? 'block' : 'none';
        formToggleBtn.innerHTML = formContent.style.display === 'none' ? 
            '<i class="fas fa-plus"></i>' : '<i class="fas fa-minus"></i>';
    });
    
    // Clear form
    clearFormBtn.addEventListener('click', () => {
        bugForm.reset();
        showToast('Form cleared', 'info');
    });
    
    // Toast close button
    toastClose.addEventListener('click', () => {
        toast.classList.remove('show');
    });
    
    // Scroll to top button
    floatingActionBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide scroll to top button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            floatingActionBtn.classList.add('visible');
        } else {
            floatingActionBtn.classList.remove('visible');
        }
    });
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('bug-title').value.trim();
    const priority = document.getElementById('bug-priority').value;
    const description = document.getElementById('bug-description').value.trim();
    
    if (!title || !description) {
        showToast('Please fill in all fields', 'warning');
        return;
    }
    
    const newBug = {
        id: Date.now().toString(),
        title,
        priority,
        description,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    bugs.unshift(newBug);
    saveBugs();
    
    // Reset form and close it
    bugForm.reset();
    formContent.style.display = 'none';
    formToggleBtn.innerHTML = '<i class="fas fa-plus"></i>';
    
    // Update UI
    renderBugs();
    updatePagination();
    updateStats();
    
    // Show success message with confetti
    showToast('Bug reported successfully!', 'success');
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
    
    // Scroll to the top of the bug list
    document.querySelector('.bug-list').scrollIntoView({ behavior: 'smooth' });
}

// Delete a bug
function deleteBug(id, e) {
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this bug?')) {
        bugs = bugs.filter(bug => bug.id !== id);
        saveBugs();
        renderBugs();
        updatePagination();
        updateStats();
        showToast('Bug deleted successfully!', 'success');
    }
}

// Toggle bug status
function toggleBugStatus(id, e) {
    if (e) e.stopPropagation();
    
    bugs = bugs.map(bug => {
        if (bug.id === id) {
            const newStatus = bug.status === 'open' ? 'closed' : 'open';
            return { 
                ...bug, 
                status: newStatus,
                updatedAt: new Date().toISOString()
            };
        }
        return bug;
    });
    
    saveBugs();
    renderBugs();
    updateStats();
    
    const bug = bugs.find(b => b.id === id);
    showToast(`Bug marked as ${bug.status === 'open' ? 'open' : 'closed'}!`, 'info');
}

// Save bugs to localStorage
function saveBugs() {
    localStorage.setItem('bugs', JSON.stringify(bugs));
}

// Filter and search bugs
function getFilteredBugs() {
    return bugs.filter(bug => {
        const matchesSearch = bug.title.toLowerCase().includes(searchQuery) || 
                           bug.description.toLowerCase().includes(searchQuery);
        const matchesFilter = currentFilter === 'all' || 
                            (currentFilter === 'open' && bug.status === 'open') ||
                            (currentFilter === 'closed' && bug.status === 'closed') ||
                            (currentFilter === bug.priority);
        
        return matchesSearch && matchesFilter;
    });
}

// Get paginated bugs
function getPaginatedBugs() {
    const filteredBugs = getFilteredBugs();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBugs.slice(startIndex, startIndex + itemsPerPage);
}

// Render bugs to the DOM
function renderBugs() {
    const filteredBugs = getFilteredBugs();
    const paginatedBugs = getPaginatedBugs();
    
    if (filteredBugs.length === 0) {
        bugList.innerHTML = `
            <div class="no-bugs">
                <i class="fas fa-bug"></i>
                <h3>No bugs found</h3>
                <p>${searchQuery || currentFilter !== 'all' ? 'Try adjusting your search or filter' : 'Start by reporting a new bug!'}</p>
            </div>
        `;
        return;
    }
    
    bugList.innerHTML = paginatedBugs.map(bug => `
        <div class="bug-item ${bug.priority} ${bug.status}" 
             onclick="toggleBugStatus('${bug.id}', event)"
             data-id="${bug.id}">
            <div class="bug-header">
                <h3 class="bug-title">${bug.title}</h3>
                <span class="badge ${bug.priority}">
                    <i class="fas fa-${getPriorityIcon(bug.priority)}"></i>
                    ${bug.priority.charAt(0).toUpperCase() + bug.priority.slice(1)}
                </span>
            </div>
            <p class="bug-description">${bug.description}</p>
            <div class="bug-footer">
                <div class="bug-meta">
                    <span class="bug-status ${bug.status}">
                        <i class="fas fa-${bug.status === 'open' ? 'exclamation-circle' : 'check-circle'}"></i>
                        ${bug.status === 'open' ? 'Open' : 'Closed'}
                    </span>
                    <span class="bug-date" title="${new Date(bug.updatedAt).toLocaleString()}">
                        <i class="far fa-clock"></i>
                        ${formatDate(bug.updatedAt)}
                    </span>
                </div>
                <div class="bug-actions">
                    <button class="btn btn-sm ${bug.status === 'open' ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleBugStatus('${bug.id}', event)">
                        <i class="fas fa-${bug.status === 'open' ? 'times' : 'check'}"></i>
                        ${bug.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteBug('${bug.id}', event)">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add animation delay to each bug item
    document.querySelectorAll('.bug-item').forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
}

// Update pagination controls
function updatePagination() {
    const filteredBugs = getFilteredBugs();
    const totalPages = Math.ceil(filteredBugs.length / itemsPerPage) || 1;
    
    // Reset to first page if current page is invalid
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = 1;
        renderBugs();
    }
    
    let paginationHTML = '';
    const maxPagesToShow = 5;
    let startPage, endPage;
    
    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }
    
    // Previous button
    paginationHTML += `
        <button class="btn btn-sm ${currentPage === 1 ? 'disabled' : ''}" 
                ${currentPage === 1 ? 'disabled' : ''}
                onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    
    // First page
    if (startPage > 1) {
        paginationHTML += `
            <button class="btn btn-sm" onclick="changePage(1)">1</button>
            ${startPage > 2 ? '<span class="ellipsis">...</span>' : ''}
        `;
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="btn btn-sm ${i === currentPage ? 'btn-primary' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>`;
    }
    
    // Last page
    if (endPage < totalPages) {
        paginationHTML += `
            ${endPage < totalPages - 1 ? '<span class="ellipsis">...</span>' : ''}
            <button class="btn btn-sm" onclick="changePage(${totalPages})">
                ${totalPages}
            </button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="btn btn-sm ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}" 
                ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}
                onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    
    pagination.innerHTML = paginationHTML;
    
    // Update items per page text
    const startItem = filteredBugs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, filteredBugs.length);
    document.getElementById('pagination-info').textContent = 
        `Showing ${startItem}-${endItem} of ${filteredBugs.length} ${filteredBugs.length === 1 ? 'bug' : 'bugs'}`;
}

// Change page
function changePage(page) {
    currentPage = page;
    renderBugs();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update statistics
function updateStats() {
    const totalBugs = bugs.length;
    const openBugs = bugs.filter(bug => bug.status === 'open').length;
    
    statsTotal.textContent = totalBugs;
    statsOpen.textContent = openBugs;
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove any existing toast type classes
    toast.className = 'toast';
    toast.classList.add(type);
    
    // Set icon based on type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    else if (type === 'error' || type === 'danger') icon = 'exclamation-circle';
    else if (type === 'warning') icon = 'exclamation-triangle';
    
    // Update toast content
    toastContent.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto-hide after delay
    const toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
    
    // Clear timeout if user interacts with toast
    toast.onmouseenter = () => clearTimeout(toastTimeout);
    toast.onmouseleave = () => {
        setTimeout(() => {
            toast.classList.remove('show');
        }, 1000);
    };
}

// Theme functions
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const isDark = savedTheme === 'dark';
    
    if (isDark) {
        document.body.classList.add('dark-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Helper functions
function getPriorityIcon(priority) {
    const icons = {
        'critical': 'skull',
        'high': 'exclamation-triangle',
        'medium': 'exclamation-circle',
        'low': 'arrow-down'
    };
    return icons[priority] || 'bug';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
        return 'Today';
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
