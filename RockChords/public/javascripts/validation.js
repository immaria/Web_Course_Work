const urlParams = new URLSearchParams(window.location.search);
const errorParam = urlParams.get('error');
const notification = document.getElementById('notification');


function checkRegisterForm() {
    let password1 = document.getElementById('password');
    let password2 = document.getElementById('password2');
    if (password1.value !== password2.value) {
        document.getElementById("alert2").removeAttribute("hidden");
        const closeButton = document.getElementById('closeButton');
        closeButton.onclick = () => {
            document.getElementById("alert2").setAttribute('hidden', 'hidden');
        };
        return false;
    }
}
