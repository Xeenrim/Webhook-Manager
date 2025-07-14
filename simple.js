console.log('Simple script loaded');

function enableAllInputs() {
    const allInputs = document.querySelectorAll('input, textarea');
    console.log('Found inputs:', allInputs.length);
    
    allInputs.forEach(input => {
        input.readOnly = false;
        input.disabled = false;
        
        input.addEventListener('input', function() {
            console.log('Input changed:', this.id, '=', this.value);
        });
    });
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - enabling inputs');
    enableAllInputs();
});


setTimeout(enableAllInputs, 100);
