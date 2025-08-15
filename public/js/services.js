// Services page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Service filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const serviceCards = document.querySelectorAll('.service-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const category = this.dataset.category;
            
            serviceCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                    setTimeout(() => card.classList.add('visible'), 10);
                } else {
                    card.classList.remove('visible');
                    setTimeout(() => card.style.display = 'none', 300);
                }
            });
        });
    });
    
    // Service selection and calculator
    const serviceCheckboxes = document.querySelectorAll('input[name="services"]');
    const totalPriceElement = document.getElementById('total-price');
    const selectedServicesList = document.getElementById('selected-services-list');
    const getQuoteBtn = document.getElementById('get-quote-btn');
    
    serviceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateCalculator);
    });
    
    function updateCalculator() {
        let total = 0;
        const selectedServices = [];
        
        serviceCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const price = parseFloat(checkbox.dataset.price);
                const serviceCard = checkbox.closest('.service-card');
                const serviceName = serviceCard.querySelector('h3').textContent;
                
                total += price;
                selectedServices.push({
                    name: serviceName,
                    price: price,
                    id: checkbox.value
                });
            }
        });
        
        // Update total price
        totalPriceElement.textContent = `$${total.toFixed(2)}`;
        
        // Update selected services list
        selectedServicesList.innerHTML = '';
        selectedServices.forEach(service => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="service-name">${service.name}</span>
                <span class="service-price">$${service.price}</span>
            `;
            selectedServicesList.appendChild(li);
        });
        
        // Update quote button
        if (selectedServices.length > 0) {
            getQuoteBtn.style.display = 'inline-block';
            const serviceIds = selectedServices.map(s => s.id).join(',');
            getQuoteBtn.href = `/contact?services=${serviceIds}&total=${total.toFixed(2)}`;
        } else {
            getQuoteBtn.style.display = 'none';
            getQuoteBtn.href = '/contact';
        }
    }
    
    // Initialize calculator
    updateCalculator();
});