document.addEventListener("DOMContentLoaded", function() {
    const cardUnsc = document.getElementById("card-unsc");
    const cardLn = document.getElementById("card-ln");
    const cardWilhelm = document.getElementById("card-wilhelm");
    const cardDisec = document.getElementById("card-disec");
    const cardOic = document.getElementById("card-oic");

    if (cardUnsc) {
        cardUnsc.addEventListener("click", function() {
            window.location.href = "./unsc.html";
        });
    }
    if (cardLn) {
        cardLn.addEventListener("click", function() {
            window.location.href = "./lon.html";
        });
    }
    if (cardWilhelm) {
        cardWilhelm.addEventListener("click", function() {
            window.location.href = "./wwc.html";
        });
    }
    if (cardDisec) {
        cardDisec.addEventListener("click", function() {
            window.location.href = "./disec.html";
        });
    }
    if (cardOic) {
        cardOic.addEventListener("click", function() {
            window.location.href = "./oic.html";
        });
    }
});