// Packages page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const customServiceCheckboxes = document.querySelectorAll('input[name="customServices"]');
    const customServicesList = document.getElementById('custom-services-list');
    const customSubtotal = document.getElementById('custom-subtotal');
    const customDiscount = document.getElementById('custom-discount');
    const customTotal = document.getElementById('custom-total');
    const requestQuoteBtn = document.getElementById('request-custom-quote');
    const compareModal = document.getElementById('comparison-modal');
    const compareBtns = document.querySelectorAll('.compare-btn');
    
    let selectedPackages = [];
    
    // Custom package builder
    customServiceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCustomPackage);
    });
    
    function updateCustomPackage() {
        const selectedServices = [];
        let subtotal = 0;
        
        customServiceCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const price = parseFloat(checkbox.dataset.price);
                const name = checkbox.dataset.name;
                
                selectedServices.push({
                    name: name,
                    price: price,
                    id: checkbox.value
                });
                
                subtotal += price;
            }
        });
        
        // Update services list
        if (selectedServices.length === 0) {
            customServicesList.innerHTML = '<p class="empty-message">No services selected</p>';
            requestQuoteBtn.style.display = 'none';
        } else {
            customServicesList.innerHTML = selectedServices.map(service => `
                <div class="selected-service-item">
                    <span class="service-name">${service.name}</span>
                    <span class="service-price">$${service.price.toFixed(2)}</span>
                </div>
            `).join('');
            requestQuoteBtn.style.display = 'block';
        }
        
        // Calculate discount (10% for 3+ services, 15% for 5+ services)
        let discountRate = 0;
        if (selectedServices.length >= 5) {
            discountRate = 0.15;
        } else if (selectedServices.length >= 3) {
            discountRate = 0.10;
        }
        
        const discountAmount = subtotal * discountRate;
        const total = subtotal - discountAmount;
        
        // Update totals
        customSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        customDiscount.textContent = `-$${discountAmount.toFixed(2)}`;
        customTotal.textContent = `$${total.toFixed(2)}`;
        
        // Update quote button link
        if (selectedServices.length > 0) {
            const serviceIds = selectedServices.map(s => s.id).join(',');
            const packageData = {
                name: 'Custom Package',
                services: serviceIds,
                subtotal: subtotal,
                discount: discountAmount,
                total: total
            };
            
            requestQuoteBtn.onclick = function() {
                window.location.href = `/contact?customPackage=${encodeURIComponent(JSON.stringify(packageData))}`;
            };
        }
    }
    
    // Package comparison
    compareBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const packageData = JSON.parse(this.dataset.package);
            addToComparison(packageData);
        });
    });
    
    function addToComparison(packageData) {
        // Remove if already exists
        selectedPackages = selectedPackages.filter(p => p.id !== packageData.id);
        
        // Add to comparison
        selectedPackages.push(packageData);
        
        // Limit to 3 packages for comparison
        if (selectedPackages.length > 3) {
            selectedPackages.shift();
        }
        
        updateComparisonModal();
        showComparisonModal();
    }
    
    function updateComparisonModal() {
        const comparisonTable = document.getElementById('comparison-table');
        
        if (selectedPackages.length === 0) {
            comparisonTable.innerHTML = '<p>No packages selected for comparison</p>';
            return;
        }
        
        let tableHTML = `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        ${selectedPackages.map(pkg => `<th>${pkg.name}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Price</strong></td>
                        ${selectedPackages.map(pkg => `<td class="price-cell">$${pkg.discountPrice}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Original Price</strong></td>
                        ${selectedPackages.map(pkg => `<td class="original-price">$${pkg.originalPrice}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Savings</strong></td>
                        ${selectedPackages.map(pkg => `<td class="savings">$${(pkg.originalPrice - pkg.discountPrice).toFixed(2)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td><strong>Services Included</strong></td>
                        ${selectedPackages.map(pkg => `<td>${pkg.services.length} services</td>`).join('')}
                    </tr>
                    <tr>
                        <td colspan="${selectedPackages.length + 1}" class="actions-row">
                            ${selectedPackages.map(pkg => `
                                <div class="comparison-actions">
                                    <button class="btn btn-primary btn-sm" onclick="selectPackage('${pkg.name}', ${pkg.discountPrice})">
                                        Select ${pkg.name}
                                    </button>
                                    <button class="btn btn-outline btn-sm" onclick="removeFromComparison(${pkg.id})">
                                        Remove
                                    </button>
                                </div>
                            `).join('')}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
        
        comparisonTable.innerHTML = tableHTML;
    }
    
    function showComparisonModal() {
        compareModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    function hideComparisonModal() {
        compareModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Modal close handlers
    const modalClose = compareModal.querySelector('.modal-close');
    modalClose.addEventListener('click', hideComparisonModal);
    
    compareModal.addEventListener('click', function(e) {
        if (e.target === this) {
            hideComparisonModal();
        }
    });
    
    // Global functions for comparison actions
    window.selectPackage = function(packageName, price) {
        window.location.href = `/contact?package=${encodeURIComponent(packageName)}&price=${price}`;
    };
    
    window.removeFromComparison = function(packageId) {
        selectedPackages = selectedPackages.filter(p => p.id !== packageId);
        updateComparisonModal();
        
        if (selectedPackages.length === 0) {
            hideComparisonModal();
        }
    };
    
    // Package card animations
    const packageCards = document.querySelectorAll('.package-card');
    
    // Add intersection observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    });
    
    packageCards.forEach(card => {
        observer.observe(card);
    });
    
    // Add hover effects for package cards
    packageCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        });
    });
});