document.addEventListener("DOMContentLoaded", function() {
    const cardUnsc = document.getElementById("card-unsc");
    const cardLn = document.getElementById("card-ln");
    const cardWilhelm = document.getElementById("card-wilhelm");
    const cardDisec = document.getElementById("card-disec");
    const cardOic = document.getElementById("card-oic");

    if (cardUnsc) {
        cardUnsc.addEventListener("click", function() {
            window.location.href = "/pdfs/unsc-study-guide.pdf";
        });
    }
    if (cardLn) {
        cardLn.addEventListener("click", function() {
            window.location.href = "/pdfs/ln-study-guide.pdf";
        });
    }
    if (cardWilhelm) {
        cardWilhelm.addEventListener("click", function() {
            window.location.href = "/pdfs/wilhelm-study-guide.pdf";
        });
    }
    if (cardDisec) {
        cardDisec.addEventListener("click", function() {
            window.location.href = "/pdfs/disec-study-guide.pdf";
        });
    }
    if (cardOic) {
        cardOic.addEventListener("click", function() {
            window.location.href = "/pdfs/oic-study-guide.pdf";
        });
    }
});